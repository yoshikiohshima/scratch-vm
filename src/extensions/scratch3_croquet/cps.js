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

function convert (block, blocks, functions, whatIsNext, useFuture) {
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
    if (!block) return asCode(whatIsNext, useFuture);
    const op = block.opcode;
    if (op === 'croquet_modelCode') {
        const id = block.next;
        if (!id) return null;
        const result = convert(blocks[id], blocks, functions, null, false);
        if (isCont(result)) return result;
        const fName = `f_${toAlnum(block.id)}`;
        functions[fName] = result.join('');
        return fName;
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
        const timesStr = times ? convert(times ? blocks[times.block] : null, blocks, functions) : ['0'];

        const nextCode = convert(blocks[nextId], blocks, functions, whatIsNext, false);

        const subCode = convert(subStack ? blocks[subStack.block] : null, blocks, functions, fNameTest, true);

        functions[fNameInit] = [
            `this.$vars['${fName}'] = 0; this.$vars['${fNameLimit}'] = Cast.toNumber(`, ...timesStr, `);`,
            ...asCode(fNameTest, false)
        ].join('');

        functions[fNameTest] = [
            `this.$vars['${fName}'] += 1;`,
            `if (this.$vars['${fName}'] > this.$vars['${fNameLimit}']) {`,
            ...asCode(nextCode, false), ';',
            `} else {`,
            ...asCode(fNameBody, false), ';',
            `}`
        ].join('');

        functions[fNameBody] = [
            ...asCode(subCode), ';'
        ].join('');
        return fNameInit;
    }
    if (op === 'control_forever') {
        const subStack = block.inputs.SUBSTACK;
        const fName = `f_${toAlnum(block.id)}`;
        const fNameBody = `${fName}_body`;
        
        const subCode = convert(subStack ? blocks[subStack.block] : null, blocks, functions, fNameBody, true);

        functions[fNameBody] = [
            ...asCode(subCode), ';'
        ].join('');
        return fNameBody;
    }
        
    if (op === 'control_if' || op === 'control_if_else') {
        const fName = `f_${toAlnum(block.id)}`;
        const fNameTest = `${fName}_test`;
        const fNameNext = `${fName}_next`;

        const subStack = block.inputs.SUBSTACK;
        const subStack2 = block.inputs.SUBSTACK2;
        const condition = block.inputs.CONDITION;
        const nextId = block.next;

        const nextCode = convert(blocks[nextId], blocks, functions, whatIsNext, useFuture);

        functions[fNameNext] = asCode(nextCode).join('');

        const subCode = convert(subStack ? blocks[subStack.block] : null, blocks, functions, fNameNext, false);

        const subCode2 = convert(subStack2 ? blocks[subStack2.block] : null, blocks, functions, fNameNext, false);

        const cCode = condition ? convert(blocks[condition.block], blocks, functions) : ['false'];

        functions[fNameTest] = [
            'if (', cCode.join(''), ') {',
            ...asCode(subCode),
            '} else {',
            ...asCode(subCode2),
            '}'
        ].join('');
        return fNameTest;
    }
    if (op === 'control_wait') {
        const fName = `f_${toAlnum(block.id)}`;
        const fNameNext = `${fName}_next`;
        const duration = block.inputs.DURATION;
        const nextId = block.next;
        const nextCode = convert(blocks[nextId], blocks, functions, whatIsNext, useFuture);
        functions[fNameNext] = asCode(nextCode).join('');

        const dCode = duration ? convert(blocks[duration.block], blocks, functions) : ['0'];

        functions[fName] = [
            'this.future(Cast.toNumber(',
            ...dCode,
            `) * 1000).invoke('${fNameNext}')`
        ].join('');
        return fName;
    }
    if (op === 'croquet_setValue') {
        const name = block.inputs.NAME;
        const value = block.inputs.VALUE;
        const next = block.next;
        const nId = name.block;
        const vId = value.block;
        const nameStr = convert(blocks[nId], blocks, functions);
        const valueStr = convert(blocks[vId], blocks, functions);

        const nnn = convert(blocks[next], blocks, functions, whatIsNext, useFuture);

        const thisOne = ['this.setValue({name: ', ...nameStr, ', value: ', ...valueStr, '})'];

        // those two lines, should be identical but the bundler seems to have real trouble.
        return [].concat(thisOne).concat([';']).concat(asCode(nnn));
        // return [...thisOne, ';', ...asCode(nnn)]
    }
    if (op === 'croquet_getValue') { // REPORTER
        const name = block.inputs.NAME;
        const nId = name.block;
        const nameStr = convert(blocks[nId], blocks, functions, null);
        return ['this.getValue(', ...nameStr, ')'];
    }
    if (['operator_add', 'operator_subtract', 'operator_multiply', 'operator_divide'].indexOf(op) >= 0) {
        const js = {
            operator_add: '+',
            operator_subtract: '-',
            operator_multiply: '*',
            operator_divide: '/',
        }[op];
        const num1 = block.inputs.NUM1;
        const num2 = block.inputs.NUM2;
        const id1 = num1.block;
        const id2 = num2.block;
        const num1Str = convert(blocks[id1], blocks, functions, null);
        const num2Str = convert(blocks[id2], blocks, functions, null);
        return ['(Cast.toNumber(', ...num1Str, `) ${js} Cast.toNumber(`, ...num2Str, '))'];
    }
    if (['operator_equals', 'operator_lt', 'operator_gt'].indexOf(op) >= 0) {
        const method = {
            operator_equals: 'equalsOp',
            operator_lt: 'ltOp',
            operator_gt: 'gtOp'
        }[op];
        const num1 = block.inputs.OPERAND1;
        const num2 = block.inputs.OPERAND2;
        const id1 = num1.block;
        const id2 = num2.block;
        const num1Str = convert(blocks[id1], blocks, functions, null);
        const num2Str = convert(blocks[id2], blocks, functions, null);
        return [`this.${method}(`, ...num1Str, ', ', ...num2Str, `)`];
    }
    if (['operator_join'].indexOf(op) >= 0) {
        const method = {operator_join: 'joinOp'}[op];
        
        const str1 = block.inputs.STRING1;
        const str2 = block.inputs.STRING2;
        const id1 = str1.block;
        const id2 = str2.block;
        const str1Str = convert(blocks[id1], blocks, functions, null);
        const str2Str = convert(blocks[id2], blocks, functions, null);
        return [`this.${method}(`, ...str1Str, ', ', ...str2Str, `)`];
    }
    if (['operator_random'].indexOf(op) >= 0) {
        const method = {operator_random: 'randomOp'}[op];
        
        const from = block.inputs.FROM;
        const to = block.inputs.TO;
        const id1 = from.block;
        const id2 = to.block;
        const fromStr = convert(blocks[id1], blocks, functions, null);
        const toStr = convert(blocks[id2], blocks, functions, null);
        return [`this.${method}((`, ...fromStr, '), (', ...toStr, `))`];
    }
    if (op === 'text') { // REPORTER
        const fields = block.fields.TEXT;
        return ["'", fields.value, "'"];
    }
    if (op === 'math_number') {
        const fields = block.fields.NUM;
        return ["'", fields.value, "'"];
    }
    if (op === 'math_whole_number' || op === 'math_positive_number') {
        const fields = block.fields.NUM;
        return ["'", fields.value, "'"];
    }
}

function convertBlock (block, blocks) {
    const functions = {};
    const cont = convert(block, blocks, functions, null);
    return {functions, entryPoint: cont};
}

if (typeof module !== 'undefined') {
    module.exports = convertBlock;
}
