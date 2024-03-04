import * as cheerio from 'cheerio';
import * as ts from 'typescript';
import * as fs from 'fs';
import { Role } from '../src/app/enums/role.enum';
import { UiSearchableElement } from 'app/interfaces/ui-searchable-element.interface';
const glob = require('glob');

interface ComponentProperties {
  [propertyName: string]: string;
}

enum TsExtraction {
  ElementsConfig = 'elements',
  ClassProperties = 'properties'
}

let uiElements: UiSearchableElement[] = [];

function formatArrayItems(inputText: string): string[] {
  let trimmed = inputText?.trim()?.slice(1, -1);
  return trimmed?.split(',')
    ?.map((keyword) => extractTextFromTFunction(keyword)
    ?.trim()
    ?.replace(/^'(.*)'$/, '$1'))
    ?.filter(Boolean);
}

function extractTsFileContent(filePath: string, extractionType: TsExtraction): string | {} {
  const fileContents = fs.readFileSync(filePath, 'utf8');
  const sourceFile = ts.createSourceFile(filePath, fileContents, ts.ScriptTarget.ES2015, true);

  let extractedElements: string;
  let properties: ComponentProperties = {};

  function visit(node: ts.Node) {
    if (extractionType === TsExtraction.ElementsConfig && ts.isVariableStatement(node)) {
      node.declarationList.declarations.forEach((declaration) => {
        if (ts.isVariableDeclaration(declaration) && declaration.name.getText(sourceFile) === 'elements') {
          const initializer = declaration.initializer;
          if (initializer) {
            extractedElements = initializer.getText(sourceFile);
          }
        }
      });
    }
    if (extractionType === TsExtraction.ClassProperties && ts.isClassDeclaration(node)) {
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

  return extractionType === TsExtraction.ClassProperties ? properties : extractedElements;
}

function extractDynamicValue(dataString: string, key: string, property: string): string {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const escapedProperty = property.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`${escapedKey}:\\s*{[^}]*${escapedProperty}:\\s*(\\[[^\\]]*\\]|'[^']*'|\\{[^}]*\\})`);
  const match = dataString.match(pattern);

  if (match && match[1]) {
    return match[1]?.replace(/^['"]+|['"]+$/g, '');
  } else {
    return null;
  }
}

function extractTextFromTFunction(inputText: string): string {
  const regex = /T\('([^']+)'\)/;
  const match = inputText.match(regex);
  if (match && match[1]) {
    return match[1].trim();
  }
  return inputText;
}

function findComponentFiles(pattern: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    glob(pattern, (error: Error, files: string[] | PromiseLike<string[]>) => {
      error ? reject(error) : resolve(files)
    });
  });
}

function parseRoles(rolesValue: string): Role[] {
  const roleNames = rolesValue.replace(/^\[|\]$/g, '')
    ?.split(', ')
    ?.map(role => role.trim());

  return roleNames.map(roleName => Role[roleName.split('.')[1] as keyof typeof Role]).filter(Boolean);
}

function parseHtmlFile(
  filePath: string,
  elementConfig: string,
  componentProperties: ComponentProperties
): UiSearchableElement[] {
  const htmlContent = fs.readFileSync(filePath, 'utf8');
  const $ = cheerio.load(htmlContent);
  const elements: UiSearchableElement[] = [];

  $('[ixUiSearchableElement]').each((_, element) => {
    const key = $(element).attr('[ixsearchconfig]').split('.')[1];

    const routerLink = formatArrayItems($(element).attr('[routerlink]')) ?? null;
    const hierarchy = formatArrayItems(extractDynamicValue(elementConfig, key, 'hierarchy')) ?? null;
    const synonyms = formatArrayItems(extractDynamicValue(elementConfig, key, 'synonyms')) ?? null;
    const anchorRouterLink = formatArrayItems(extractDynamicValue(elementConfig, key, 'anchorRouterLink')) ?? null;
    const anchor = extractDynamicValue(elementConfig, key, 'anchor');
    const triggerAnchor = extractDynamicValue(elementConfig, key, 'triggerAnchor');

    const rolesAttrName = $(element).attr('*ixrequiresroles') || extractDynamicValue(elementConfig, key, 'requiredRoles') || '';

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

async function extractUiSearchableElements(): Promise<void> {
  try {
    const tsFiles = await findComponentFiles("src/**/*.elements.ts");
    tsFiles.forEach((elementsTsFilePath) => {
      const htmlComponentFilePath = elementsTsFilePath.replace('.elements.ts', '.component.html');
      const tsComponentFilePath = elementsTsFilePath.replace('.elements.ts', '.component.ts');

      if (fs.existsSync(htmlComponentFilePath)) {
        const elementConfig = extractTsFileContent(elementsTsFilePath, TsExtraction.ElementsConfig) as string;
        const componentProperties = extractTsFileContent(tsComponentFilePath, TsExtraction.ClassProperties) as {};
        const elements = parseHtmlFile(htmlComponentFilePath, elementConfig, componentProperties);
        uiElements = uiElements.concat(elements);
      }
    });

    fs.writeFileSync('src/assets/ui-searchable-elements.json', JSON.stringify(uiElements, null, 2));
  } catch (err) {
    console.error("An error occurred:", err);
  }
}

extractUiSearchableElements();
