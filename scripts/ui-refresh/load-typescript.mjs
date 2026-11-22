import { readFile } from 'node:fs/promises';
import ts from 'typescript';

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type -- Plain JavaScript test utility.
export const loadTypescript = async (url) => {
    const source = await readFile(url, 'utf8');
    const { outputText } = ts.transpileModule(source, {
        compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
    });
    if (/\bimport\s|\brequire\(/.test(outputText)) {
        throw new Error('UI helper test loader only accepts modules without runtime imports');
    }
    return import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
};
