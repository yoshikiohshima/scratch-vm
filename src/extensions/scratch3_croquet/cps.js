function toAlnum (id) {
    const result = [];
    for (let i = 0; i < id.length; i++) {
        let c = id[i];
        if (!/[a-zA-Z_0-9]/.test(c)) {
            c = c.charCodeAt(0).toString(16);
        }
        result.push(c);
    }
    return result.join('');
}

function convert (block, blocks, functions, whatIsNext) {
    const isCont = e => typeof e === 'string';
    const asCode = (e, isFuture) => {
        const method = isFuture ? 'futureInvoke' : 'invoke';
        if (!e) {
            return [];
        }
        if (isCont(e)) {
            return [`this.${method}('${e}')`];
        }
        return e;
    };
    if (!block) return [];
    const op = block.opcode;
    if (op === 'croquet_modelCode') {
        const id = block.next;
        if (!id) return {code: [], isCont: false};
        return convert(blocks[id], blocks, functions, null);
    }
    if (op === 'control_repeat') {
        const subStack = block.inputs.SUBSTACK;
        const nextId = block.next;

        const fName = `f_${toAlnum(block.id)}`;
        const fNameLimit = `${fName}_Limit`;
        const fNameTest = `${fName}_test`;
        const fNameInit = `${fName}_init`;
        const fNameBody = `${fName}_body`;

        const times = block.inputs.TIMES;
        const timesStr = times ? convert(blocks[times.block], blocks, functions) : ['0'];

        if (nextId) {
            whatIsNext = convert(blocks[nextId], blocks, functions, whatIsNext);
        }

        let subCode;
        if (subStack) {
            subCode = convert(blocks[subStack.block], blocks, functions);
        }

        functions[`'${fNameInit}'`] = [
            `this.vars['${fName}'] = 0; this.vars.['${fNameLimit}'] = Cast.toNumber(`, ...timesStr, `);`,
            `this.invoke('${fNameTest}');`
        ].join('');

        functions[`${fNameTest}`] = [
            `this.vars['${fName}'] += 1;`,
            `if (this.vars['${fName}'] > this.vars['${fNameLimit}']) {`,
            ...asCode(whatIsNext, false), ';',
            `} else {`,
            ...asCode(fNameBody), ';',
            `}`
        ].join('');

        functions[`${fNameBody}`] = [
            ...asCode(subCode), ';', ...asCode(fNameTest, true), ';'
        ].join('');
        return fNameInit;
    }
    if (op === 'control_forever') {
        const subStack = block.inputs.SUBSTACK;
        const fName = `f_${toAlnum(block.id)}`;
        const fNameBody = `${fName}_body`;
        
        let subCode;
        if (subStack) {
            subCode = convert(blocks[subStack.block], blocks, functions, null);
        }

        functions[`${fNameBody}`] = [
            ...asCode(subCode), ';', ...asCode(fNameBody, true), ';'
        ].join('');
        return fNameBody;
    }
        
    if (op === 'control_if' || op === 'control_if_else') {

        const fName = `f_${toAlnum(block.id)}`;
        const fNameTest = `${fName}_test`;

        const subStack = block.inputs.SUBSTACK;
        const subStack2 = block.inputs.SUBSTACK2;
        const condition = block.inputs.CONDITION;
        const nextId = block.next;

        if (nextId) {
            whatIsNext = convert(blocks[nextId], blocks, functions, whatIsNext);
        }

        let subCode;
        if (subStack) {
            subCode = convert(blocks[subStack.block], blocks, functions, whatIsNext);
        }

        let subCode2;
        if (subStack2) {
            subCode2 = convert(blocks[subStack2.block], blocks, functions, whatIsNext);
        }

        const cCode = condition ? convert(blocks[condition.block], blocks, functions, null) : ['false'];

        functions[`'${fNameTest}'`] = [
            'if (', cCode.join(''), ') {',
            ...asCode(subCode),
            '} else {',
            ...asCode(subCode2),
            '}'
        ].join('');
        return fNameTest;
    }
    if (op === 'croquet_setValue') {
        const name = block.inputs.NAME;
        const value = block.inputs.VALUE;
        const next = block.next;
        const nId = name.block;
        const vId = value.block;
        const nameStr = convert(blocks[nId], blocks, functions);
        const valueStr = convert(blocks[vId], blocks, functions);

        if (next) {
            whatIsNext = convert(blocks[next], blocks, functions, whatIsNext);
        }
        
        const thisOne = ['this.setValue({name: ', ...nameStr, ', value: ', ...valueStr, '})'];

        if (whatIsNext) {
            return [...thisOne, ';', ...asCode(whatIsNext)];
        }
        return thisOne;
    }
    if (op === 'croquet_getValue') { // REPORTER
        const name = block.inputs.NAME;
        const nId = name.block;
        const nameStr = convert(blocks[nId], blocks, functions, null);
        return ['this.getValue(', ...nameStr, ')'];
    }
    if (['operator_add'].indexOf(op) >= 0) {
        const js = {operator_add: '+'}[op];
        const num1 = block.inputs.NUM1;
        const num2 = block.inputs.NUM2;
        const id1 = num1.block;
        const id2 = num2.block;
        const num1Str = convert(blocks[id1], blocks, functions, null);
        const num2Str = convert(blocks[id2], blocks, functions, null);
        return ['(Cast.toNumber(', ...num1Str, `) ${js} Cast.toNumber(`, ...num2Str, '))'];
    }
    if (['operator_equals'].indexOf(op) >= 0) {
        const js = {operator_equals: '==='}[op];
        const num1 = block.inputs.OPERAND1;
        const num2 = block.inputs.OPERAND2;
        const id1 = num1.block;
        const id2 = num2.block;
        const num1Str = convert(blocks[id1], blocks, functions, null);
        const num2Str = convert(blocks[id2], blocks, functions, null);
        return ['((', ...num1Str, `) ${js} (`, ...num2Str, '))'];
    }
    if (op === 'text') { // REPORTER
        const fields = block.fields.TEXT;
        return ["'", fields.value, "'"];
    }
    if (op === 'math_number') {
        const fields = block.fields.NUM;
        return ["'", fields.value, "'"];
    }
    if (op === 'math_whole_number') {
        const fields = block.fields.NUM;
        return ["'", fields.value, "'"];
    }
}

function convertBlock (block, blocks) {
    const functions = {};
    const cont = convert(block, blocks, functions, null);
    return {functions, entryPoint: cont};
}

if (module) {
    module.exports = convertBlock;
}
