import { parseStringTemplateGenerator, evaluateParsedString } from 'string-template-parser';

const QUOTED_STRING_TEST = (remainingString: string) => remainingString.charAt(0) === '{';
const QUOTED_STRING_GET_AND_ADVANCE = (remainingString: string, advance: (length: number) => void) => {
	let currentPosition = 1;
	let depth = 1;
	while (depth > 0 && currentPosition < remainingString.length) {
		if (remainingString[currentPosition] === '\\') {
			currentPosition += 2;
			continue;
		}
		if (remainingString[currentPosition] === '{') {
			depth++;
		}
		if (remainingString[currentPosition] === '}') {
			depth--;
		}
		currentPosition++;
	}
	const result = remainingString.substr(0, currentPosition);
	advance(currentPosition);
	return result;
};

const parseI18NString = parseStringTemplateGenerator({
	VARIABLE_START: /^{\s*/,
	VARIABLE_END: /^\s*}/,
	PIPE_START: /^\s*,\s*/,
	PIPE_PARAMETER_START: /^\s*,\s*/,
	QUOTED_STRING_IN_PARAMETER_TEST: QUOTED_STRING_TEST,
	QUOTED_STRING_IN_PARAMETER_GET_AND_ADVANCE: QUOTED_STRING_GET_AND_ADVANCE
});
const parseI18NParameter = parseStringTemplateGenerator({
	VARIABLE_START: /^{/,
	VARIABLE_END: /^}/,
	PIPE_START: /^$/,
	PIPE_PARAMETER_START: /^$/,
	QUOTED_STRING_TEST,
	QUOTED_STRING_GET_AND_ADVANCE,
	QUOTED_STRING_IN_PARAMETER_TEST: QUOTED_STRING_TEST,
	QUOTED_STRING_IN_PARAMETER_GET_AND_ADVANCE: QUOTED_STRING_GET_AND_ADVANCE
});

const evaluateI18NString = (str: string, variables: {[varName: string]: string}, getValue: (varName: string) => string) =>
	evaluateParsedString(parseI18NString(str), variables, {
		plural: (value: string, [parameter]: string[]) => {
			const parsedParameter = parseI18NParameter(parameter);
			const options = parsedParameter.literals.map(literal => literal.trim()).slice(0, parsedParameter.literals.length - 1);
			const values = parsedParameter.variables.map(variable => evaluateI18NString(variable.name, variables, getValue));
			const mapper: {[option: string]: string} = options.reduce((map, option, index) => ({...map, [option.charAt(0) === '=' ? option.slice(1).trim() : option.trim()]: values[index]}), {});
			const numValue = +value;
			if (mapper.hasOwnProperty(numValue.toString())) {
				return mapper[value];
			}
			if (numValue === numValue) {
				const lastDigit: {[digit: number]: string[]} = {
					0: ['zero'],
					1: ['one'],
					2: ['two', 'few'],
					3: ['three', 'few'],
					4: ['four', 'few'],
					5: ['five', 'many'],
					6: ['six', 'many'],
					7: ['seven', 'many'],
					8: ['eight', 'many'],
					9: ['nine', 'many']
				};
				return mapper.hasOwnProperty(value)
					? mapper[value]
					: [...(numValue >= 10 && numValue < 20) ? ['many'] : lastDigit[numValue % 10] || ['many'], 'other']
						.filter(key => mapper.hasOwnProperty(key)).map(key => mapper[key])[0] || '';
			}
			return mapper['other'] || '';
		},
		select: (value: string, [parameter]: string[]) => {
			const parsedParameter = parseI18NParameter(parameter);
			const options = parsedParameter.literals.map(literal => literal.trim()).slice(0, parsedParameter.literals.length - 1);
			const values = parsedParameter.variables.map(variable => evaluateI18NString(variable.name, variables, getValue));
			const mapper: {[option: string]: string} = options.reduce((map, option, index) => ({...map, [option.trim()]: values[index]}), {});
			return mapper[value] || '';
		}
	}, getValue);

// console.log(evaluateI18NString('this is {numPeople, plural, =0 {no one} =1 {someone} other {everyone}', {numPeople: '0'}));
// console.log(evaluateI18NString('this is {numPeople, plural, =0 {no one} =1 {someone} other {everyone}', {numPeople: '1'}));
// console.log(evaluateI18NString('this is {numPeople, plural, =0 {no one} =1 {someone} other {everyone}', {numPeople: '2'}));
// console.log(evaluateI18NString('this is {gender, select, m {a man} f {a woman}', {gender: 'm'}));
// console.log(evaluateI18NString('this is {gender, select, m {a man} f {a woman}', {gender: 'f'}));
// console.log(evaluateI18NString('this is {gender, select, m {a man} f {a woman}', {gender: 'n'}));
// console.log(evaluateI18NString('this is {numPeople, plural, =0 {no one} =1 {{gender, select, m {a man} f {a woman}}} other {everyone}}', {numPeople: '0', gender: 'm'}))
// console.log(evaluateI18NString('this is {numPeople, plural, =0 {no one} =1 {{gender, select, m {a man} f {a woman}}} other {everyone}}', {numPeople: '0', gender: 'f'}))
// console.log(evaluateI18NString('this is {numPeople, plural, =0 {no one} =1 {{gender, select, m {a man} f {a woman}}} other {everyone}}', {numPeople: '1', gender: 'm'}))
// console.log(evaluateI18NString('this is {numPeople, plural, =0 {no one} =1 {{gender, select, m {a man} f {a woman}}} other {everyone}}', {numPeople: '1', gender: 'f'}))
// console.log(evaluateI18NString('this is {numPeople, plural, =0 {no one} =1 {{gender, select, m {a man} f {a woman}}} other {everyone}}', {numPeople: '2', gender: 'm'}))
// console.log(evaluateI18NString('this is {numPeople, plural, =0 {no one} =1 {{gender, select, m {a man} f {a woman}}} other {everyone}}', {numPeople: '2', gender: 'f'}))
//
// console.log(evaluateI18NString('{n, plural, zero {zero} five {five} few {few} many {many}', {n: '0'}));
// console.log(evaluateI18NString('{n, plural, zero {zero} five {five} few {few} many {many}', {n: '1'}));
// console.log(evaluateI18NString('{n, plural, zero {zero} five {five} few {few} many {many}', {n: '2'}));
// console.log(evaluateI18NString('{n, plural, zero {zero} five {five} few {few} many {many}', {n: '3'}));
// console.log(evaluateI18NString('{n, plural, zero {zero} five {five} few {few} many {many}', {n: '4'}));
// console.log(evaluateI18NString('{n, plural, zero {zero} five {five} few {few} many {many}', {n: '5'}));
// console.log(evaluateI18NString('{n, plural, zero {zero} five {five} few {few} many {many}', {n: '10'}));
// console.log(evaluateI18NString('{n, plural, zero {zero} five {five} few {few} many {many}', {n: '20'}));
// console.log(evaluateI18NString('{n, plural, zero {zero} five {five} few {few} many {many}', {n: '25'}));
// console.log(evaluateI18NString('{n, plural, zero {zero} few {few} many {many}', {n: '25'}));
//
// console.dir(parseI18NParameter('=0 {no one} =1 {someone, {gender, select, m {mister} f {missus}}} other {everyone}'), {depth: 10});

export class TranslateICUParser {
	interpolate(expr: string | Function, params?: any): string {
		if (typeof expr === 'function') {
			return expr(params);
		}
		return evaluateI18NString(expr, params, this.getValue.bind(this));
	}
	
	getValue(target: any, key: string): any {
		let keys = key && key.split('.') || [];
		key = '';
		do {
			key += keys.shift();
			if(target != null && target[key] != null && (typeof target[key] === 'object' || !keys.length)) {
				target = target[key];
				key = '';
			} else if(!keys.length) {
				target = undefined;
			} else {
				key += '.';
			}
		} while(keys.length);
		
		return target;
	}
}
