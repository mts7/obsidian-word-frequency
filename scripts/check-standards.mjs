import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { createRequire } from 'module';
import { join, relative, resolve } from 'path';

const ROOT = resolve(process.argv[2] ?? process.cwd());
const SCANNED_FOLDERS = ['src', 'test', 'scripts', '__mocks__'];
const SKIPPED_FOLDERS = new Set(['node_modules', 'vaults']);
const SOURCE_FILE = /\.(ts|mts|js|mjs|cjs)$/;
const TEST_FILE = /__tests__|__mocks__|test\//;
const MAX_LINE_LENGTH = 120;
const MIN_NAME_LENGTH = 3;
const REQUIRED_API_NAMES = new Set([
    'constructor',
    'onload',
    'onunload',
    'onOpen',
    'onClose',
    'display',
    'on',
    'onLayoutReady',
]);
const BUILT_IN_CLASSES = new Set([
    'Map',
    'Set',
    'CustomEvent',
    'Error',
    'Promise',
]);
const VERBS = new Set(
    `activate add append apply build calculate cancel capture check clear close collect count cover
    create dispatch edit empty expect find finish get handle has is listen load open print record
    refresh register remember remove render replace reset reveal run save search segment select set show
    start switch time trigger type uncover update use wait`.split(/\s+/)
);

const typescript = createRequire(join(ROOT, 'package.json'))('typescript');

function findRootFiles() {
    return readdirSync(ROOT)
        .filter(
            (name) =>
                SOURCE_FILE.test(name) && statSync(join(ROOT, name)).isFile()
        )
        .map((name) => join(ROOT, name));
}

function findSourceFiles(folder) {
    return readdirSync(folder).flatMap((name) => {
        const path = join(folder, name);
        if (statSync(path).isDirectory()) {
            return SKIPPED_FOLDERS.has(name) ? [] : findSourceFiles(path);
        }

        return SOURCE_FILE.test(name) && !name.endsWith('.d.ts') ? [path] : [];
    });
}

function getFirstWord(name) {
    return name.split(/(?=[A-Z])/)[0].toLowerCase();
}

function getFunctionName(node) {
    if (
        typescript.isFunctionDeclaration(node) ||
        typescript.isMethodDeclaration(node)
    ) {
        return node.name?.getText();
    }
    const initializer = typescript.isVariableDeclaration(node)
        ? node.initializer
        : undefined;
    const isFunction =
        initializer &&
        (typescript.isArrowFunction(initializer) ||
            typescript.isFunctionExpression(initializer));

    return isFunction ? node.name.getText() : undefined;
}

function isDeclaredName(node) {
    return (
        (typescript.isVariableDeclaration(node) ||
            typescript.isParameter(node) ||
            typescript.isBindingElement(node)) &&
        typescript.isIdentifier(node.name)
    );
}

function isInjectableDefault(node) {
    for (
        let current = node;
        current.parent !== undefined;
        current = current.parent
    ) {
        const { parent } = current;
        const isFallback =
            typescript.isBinaryExpression(parent) &&
            parent.operatorToken.kind ===
                typescript.SyntaxKind.QuestionQuestionToken &&
            parent.right === current;
        if (
            isFallback ||
            (typescript.isParameter(parent) && parent.initializer === current)
        ) {
            return true;
        }
    }

    return false;
}

function getConstructedClass(node) {
    return typescript.isNewExpression(node)
        ? node.expression.getText()
        : undefined;
}

function findComments(source) {
    const comments = new Map();
    const addComments = (ranges) =>
        (ranges ?? []).forEach((range) =>
            comments.set(range.pos, source.text.slice(range.pos, range.end))
        );
    const collectComments = (node) => {
        addComments(
            typescript.getLeadingCommentRanges(source.text, node.getFullStart())
        );
        addComments(
            typescript.getTrailingCommentRanges(source.text, node.getEnd())
        );
        node.getChildren(source).forEach(collectComments);
    };
    collectComments(source);

    return [...comments].map(([position, text]) => ({ position, text }));
}

function checkLines(file, findings) {
    file.text.split('\n').forEach((line, index) => {
        const location = `${file.path}:${index + 1}`;
        if (line.length > MAX_LINE_LENGTH) {
            findings.longLines.push(`${location} (${line.length} characters)`);
        }
        if (file.isTest) {
            for (const match of line.matchAll(/\b\w+\['(\w+)'\]/g)) {
                findings.bracketAccessInTests.push(`${location} ${match[0]}`);
            }
        }
    });
}

function checkComments(file, findings) {
    for (const comment of findComments(file.source)) {
        findings.comments.push(
            `${file.locate(comment.position)} ${comment.text.split('\n')[0].slice(0, 80)}`
        );
    }
}

function checkNode(node, file, findings) {
    const getLocation = () => file.locate(node.getStart());
    const functionName = getFunctionName(node);
    if (
        functionName &&
        !REQUIRED_API_NAMES.has(functionName) &&
        !VERBS.has(getFirstWord(functionName))
    ) {
        findings.functionsWithoutVerbs.push(`${getLocation()} ${functionName}`);
    }
    if (
        isDeclaredName(node) &&
        node.name.text.length < MIN_NAME_LENGTH &&
        node.name.text !== '_'
    ) {
        findings.shortNames.push(`${getLocation()} ${node.name.text}`);
    }
    const constructedClass = getConstructedClass(node);
    const isProjectClass =
        /^[A-Z]/.test(constructedClass ?? '') &&
        !BUILT_IN_CLASSES.has(constructedClass);
    if (!file.isTest && isProjectClass && !isInjectableDefault(node)) {
        findings.hardWiredConstruction.push(
            `${getLocation()} new ${constructedClass}`
        );
    }
    typescript.forEachChild(node, (child) => checkNode(child, file, findings));
}

function loadFile(path) {
    const text = readFileSync(path, 'utf8');
    const source = typescript.createSourceFile(
        path,
        text,
        typescript.ScriptTarget.Latest,
        true
    );
    const relativePath = relative(ROOT, path);

    return {
        path: relativePath,
        text,
        source,
        isTest: TEST_FILE.test(relativePath),
        locate: (position) =>
            `${relativePath}:${source.getLineAndCharacterOfPosition(position).line + 1}`,
    };
}

function printFindings(findings) {
    for (const [rule, entries] of Object.entries(findings)) {
        console.log(`\n${rule}: ${entries.length}`);
        entries.forEach((entry) => console.log(`  ${entry}`));
    }
}

function checkStandards() {
    const findings = {
        comments: [],
        longLines: [],
        functionsWithoutVerbs: [],
        shortNames: [],
        bracketAccessInTests: [],
        hardWiredConstruction: [],
    };
    const paths = [
        ...findRootFiles(),
        ...SCANNED_FOLDERS.map((folder) => join(ROOT, folder))
            .filter((folder) => existsSync(folder))
            .flatMap(findSourceFiles),
    ];
    for (const file of paths.map(loadFile)) {
        checkLines(file, findings);
        checkComments(file, findings);
        checkNode(file.source, file, findings);
    }
    printFindings(findings);

    return Object.values(findings).flat().length;
}

process.exitCode = checkStandards() > 0 ? 1 : 0;
