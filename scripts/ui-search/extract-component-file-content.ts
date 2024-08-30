import * as fs from 'fs';
import ts from 'typescript';

export function extractComponentFileContent(filePath: string): Record<string, string> {
  const fileContents = fs.readFileSync(filePath, 'utf8');
  const sourceFile = ts.createSourceFile(filePath, fileContents, ts.ScriptTarget.ES2015, true);

  const properties: Record<string, string> = {};

  function visit(node: ts.Node): void {
    if (ts.isClassDeclaration(node)) {
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

  return properties;
}
