import * as cheerio from 'cheerio';
import * as ts from 'typescript';
import * as fs from 'fs';
import { Role } from '../src/app/enums/role.enum';
import { UiSearchableElement } from 'app/interfaces/ui-searchable-element.interface';

const glob = require('glob');

interface ComponentProperties {
  [propertyName: string]: string;
}

let uiElements: UiSearchableElement[] = [];

function extractComponentProperties(filePath: string): ComponentProperties {
  const sourceFile = ts.createSourceFile(
    filePath,
    fs.readFileSync(filePath, 'utf8'),
    ts.ScriptTarget.ES2015,
    true
  );

  let properties: ComponentProperties = {};

  function visit(node: ts.Node) {
    if (ts.isClassDeclaration(node)) {
      node.members.forEach(member => {
        if (ts.isPropertyDeclaration(member) && member.initializer) {
          const propertyName = member.name.getText(sourceFile);
          properties[propertyName] = member.initializer.getText(sourceFile);
        }
      });
    }
    ts.forEachChild(node, visit);
  }

  ts.forEachChild(sourceFile, visit);
  return properties;
}

function extractItems(inputText: string): string[] {
  let trimmed = inputText?.trim()?.slice(1, -1);

  return trimmed
    ?.split(',')
    ?.map((keyWord) => extractTextBeforeTranslate(keyWord)
    ?.trim()
    ?.replace(/^'(.*)'$/, '$1'));
}

function parseHtmlFile(filePath: string, componentProperties: ComponentProperties): UiSearchableElement[] {
  const htmlContent = fs.readFileSync(filePath, 'utf8');
  const $ = cheerio.load(htmlContent);
  const elements: UiSearchableElement[] = [];

  $('[ixUiSearchableElement]').each((_, element) => {
    const hierarchy = extractItems($(element).attr('[uisearchhierarchy]')) ?? []
    const synonyms = extractItems($(element).attr('[uisearchsynonyms]')) ?? []
    const routerLink = extractItems($(element).attr('[routerlink]')) ?? []
    const anchorRouterLink = extractItems($(element).attr('[uisearchanchorrouterlink]')) ?? [];
    const anchor = ($(element).attr('id') || $(element).attr('[attr.id]') || '')?.replace(/^['"]+|['"]+$/g, '');
    const triggerAnchor = ($(element).attr('uisearchtriggeranchor') || $(element).attr('[uisearchtriggeranchor]') || '')
      ?.replace(/^['"]+|['"]+$/g, '');
    const rolesAttrName = $(element).attr('*ixrequiresroles') || $(element).attr('[uisearchrequiredroles]');

    let requiredRoles = parseRoles(rolesAttrName);

    if (rolesAttrName && componentProperties[rolesAttrName]) {
      requiredRoles = parseRoles(componentProperties[rolesAttrName])
    }

    elements.push({
      hierarchy,
      synonyms,
      requiredRoles,
      routerLink,
      anchorRouterLink,
      anchor,
      triggerAnchor
    });
  });

  return elements;
}

function extractTextBeforeTranslate(inputText: string): string {
  const regex = /\(?\s*(.*?)\s*\|\s*translate\s*\)?/;
  const match = inputText.match(regex);
  if (match && match[1]) {
      return match[1].trim();
  }
  return inputText;
}

function findComponentFiles(pattern: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    glob(pattern, (error: Error, files: string[] | PromiseLike<string[]>) => {
      if (error) {
        reject(error);
      } else {
        resolve(files);
      }
    });
  });
}

function parseRoles(roleString: string): Role[] {
  const roleNames = roleString.replace(/^\[|\]$/g, '').split(', ').map(role => role.trim());

  const roleValues = roleNames.map(roleName => {
    const key = roleName.split('.')[1];
    return Role[key as keyof typeof Role];
  }).filter(Boolean);

  return roleValues;
}

async function extractUiSearchableElements(): Promise<void> {
  try {
    const tsFiles = await findComponentFiles("src/**/*.component.ts");
    tsFiles.forEach(tsFile => {
      const htmlFilePath = tsFile.replace('.ts', '.html');
      if (fs.existsSync(htmlFilePath)) {
        const componentProperties = extractComponentProperties(tsFile);
        const elements = parseHtmlFile(htmlFilePath, componentProperties);
        uiElements = uiElements.concat(elements);
      }
    });

    fs.writeFileSync('src/assets/ui-searchable-elements.json', JSON.stringify(uiElements, null, 2));
    console.log("Extraction complete.");
  } catch(err) {
    console.error("An error occurred:", err);
  }
}

extractUiSearchableElements();
