/* eslint-disable import/no-extraneous-dependencies */
import * as fs from 'fs';
import * as ts from 'typescript';
import { TsExtraction } from './ts-extraction.enum';

export function extractTsFileContent(filePath: string, extractionType: TsExtraction): Record<string, string> | string {
  const fileContents = fs.readFileSync(filePath, 'utf8');
  const sourceFile = ts.createSourceFile(filePath, fileContents, ts.ScriptTarget.ES2015, true);

  let extractedElements: string;
  const properties: Record<string, string> = {};

  function visit(node: ts.Node): void {
    if (extractionType === TsExtraction.ElementsConfig && ts.isVariableStatement(node)) {
      node.declarationList.declarations.forEach((declaration) => {
        if (ts.isVariableDeclaration(declaration) && declaration.name.getText(sourceFile)) {
          const initializer = declaration.initializer;
          if (initializer) {
            extractedElements = initializer.getText(sourceFile);
          }
        }
      });
    }

    if (extractionType === TsExtraction.ClassProperties && ts.isClassDeclaration(node)) {
      node.members.forEach((member) => {
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
