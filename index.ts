import { parseStringTemplateGenerator, evaluateParsedString, PipeFunction } from 'string-template-parser';
import 'core-js/es7/object';

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

// const I18N_PIPES_FULL = (
// 	variables: {[varName: string]: any},
// 	interpolate: (variable: string, params?: any) => string
// ): {[pipeName: string]: PipeFunction} => ({
// 	plural: (value: string, [parameter]: string[]) => {
// 		const parsedParameter = parseI18NParameter(parameter);
// 		const options = parsedParameter.literals.map(literal => literal.trim()).slice(0, parsedParameter.literals.length - 1);
// 		const values = parsedParameter.variables.map(variable => interpolate(variable.name, variables));
// 		const mapper: {[option: string]: string} = options.reduce((map, option, index) => ({...map, [option.charAt(0) === '=' ? option.slice(1).trim() : option.trim()]: values[index]}), {});
// 		const numValue = +value;
// 		if (mapper.hasOwnProperty(numValue.toString())) {
// 			return mapper[value];
// 		}
// 		if (numValue === numValue) {
// 			const lastDigit: {[digit: number]: string[]} = {
// 				0: ['zero'],
// 				1: ['one'],
// 				2: ['two', 'few'],
// 				3: ['three', 'few'],
// 				4: ['four', 'few'],
// 				5: ['five', 'many'],
// 				6: ['six', 'many'],
// 				7: ['seven', 'many'],
// 				8: ['eight', 'many'],
// 				9: ['nine', 'many']
// 			};
// 			return mapper.hasOwnProperty(value)
// 				? mapper[value]
// 				: [
// 				...(numValue >= 10 && numValue < 20) ? ['many'] : lastDigit[numValue % 10] || ['many'],
// 				...(numValue >= 20) ? ['many'] : [], 'other'
// 			].filter(key => mapper.hasOwnProperty(key)).map(key => mapper[key])[0] || '';
// 		}
// 		return mapper['other'] == null ? '' : mapper['other'];
// 	},
// 	select: (value: string, [parameter]: string[]) => {
// 		const parsedParameter = parseI18NParameter(parameter);
// 		const options = parsedParameter.literals.map(literal => literal.trim()).slice(0, parsedParameter.literals.length - 1);
// 		const values = parsedParameter.variables.map(variable => evaluateI18NString(variable.name, variables, getValue));
// 		const mapper: {[option: string]: string} = options.reduce((map, option, index) => ({...map, [option.trim()]: values[index]}), {});
// 		return mapper[value] == null ? '' : mapper[value];
// 	}
// });

const I18N_PIPES = {
	plural: (value: any, options: string[], values: string[]) => {
		options = options.map(option => option.trim()).slice(0, options.length - 1);
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
				: [
				...(numValue >= 10 && numValue < 20) ? ['many'] : lastDigit[numValue % 10] || ['many'],
				...(numValue >= 20) ? ['many'] : [], 'other'
			].filter(key => mapper.hasOwnProperty(key)).map(key => mapper[key])[0] || '';
		}
		return mapper['other'] == null ? '' : mapper['other'];
	},
	select: (value: any, options: string[], values: string[]) => {
		options = options.map(option => option.trim()).slice(0, options.length - 1);
		const mapper: {[option: string]: string} = options.reduce((map, option, index) => ({...map, [option.trim()]: values[index]}), {});
		return mapper[value] == null ? '' : mapper[value];
	}
};

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

export interface ICUPipeFunction {
	(value: any, options: string[], parameters: string[]): string;
}

export class TranslateICUCustomParser {
	private pipeEntries: [string, ICUPipeFunction][] = [];
	
	constructor(private additionalPipes?: {[pipeName: string]: ICUPipeFunction}) {
		this.pipeEntries = Object.entries({...additionalPipes || {}, ...I18N_PIPES});
	}
	
	private getPipes(
		variables: {[varName: string]: string}
	): {[pipeName: string]: PipeFunction} {
		return this.pipeEntries
			.map(([pipeName, pipe]) => ({[pipeName]: (value: any, [parameter]: string[]) => {
				const parsedParameter = parseI18NParameter(parameter);
				const options = parsedParameter.literals;
				const values = parsedParameter.variables.map(variable => this.interpolate(variable.name, variables));
				
				return pipe(value, options, values);
			}}))
			.reduce((acc, crt) => ({...acc, ...crt}), {});
	}
	
	interpolate(expr: string | Function, params?: any): string {
		return typeof expr === 'function'
			? expr(params)
			: evaluateParsedString(
				parseI18NString(expr),
				params,
				this.getPipes(params),
				(variableName: string) => this.getValue(params, variableName)
			);
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
		return target || key;
	}
}

export class TranslateICUParser extends TranslateICUCustomParser {
	constructor() {
		super({});
	}
}

// TODO: make these actual tests

// const parser = new TranslateICUParser({
// 	'?': (value: any, parameters: string[], options: string[]) => {
// 		parameters = parameters.map(option => option.trim()).slice(0, parameters.length - 1);
// 		const mapper: {[option: string]: string} = parameters.reduce((map, parameter, index) => ({...map, [parameter.trim()]: options[index]}), {});
// 		console.dir({value, parameters, options, mapper}, {depth: 10});
// 		return mapper[value] == null ? mapper[''] : mapper[':'];
// 	}
// });

// console.log(parser.interpolate('hi', {}));
// console.log(parser.interpolate('hi {name}', {name: 'Yogi'}));
// console.log(parser.interpolate('hi {name, ?, {{name}} : {mysterious person}', {}));
// console.log(parser.interpolate('hi {name, ?, {{name}} : {mysterious person}', {name: 'Yogi'}));
//
// console.log(parser.interpolate('this is {numPeople, plural, =0 {no one} =1 {someone} other {everyone}', {numPeople: '0'}));
// console.log(parser.interpolate('this is {numPeople, plural, =0 {no one} =1 {someone} other {everyone}', {numPeople: '1'}));
// console.log(parser.interpolate('this is {numPeople, plural, =0 {no one} =1 {someone} other {everyone}', {numPeople: '2'}));
// console.log(parser.interpolate('this is {gender, select, m {a man} f {a woman}', {gender: 'm'}));
// console.log(parser.interpolate('this is {gender, select, m {a man} f {a woman}', {gender: 'f'}));
// console.log(parser.interpolate('this is {gender, select, m {a man} f {a woman}', {gender: 'n'}));
// console.log(parser.interpolate('this is {numPeople, plural, =0 {no one} =1 {{gender, select, m {a man} f {a woman}}} other {everyone}}', {numPeople: '0', gender: 'm'}))
// console.log(parser.interpolate('this is {numPeople, plural, =0 {no one} =1 {{gender, select, m {a man} f {a woman}}} other {everyone}}', {numPeople: '0', gender: 'f'}))
// console.log(parser.interpolate('this is {numPeople, plural, =0 {no one} =1 {{gender, select, m {a man} f {a woman}}} other {everyone}}', {numPeople: '1', gender: 'm'}))
// console.log(parser.interpolate('this is {numPeople, plural, =0 {no one} =1 {{gender, select, m {a man} f {a woman}}} other {everyone}}', {numPeople: '1', gender: 'f'}))
// console.log(parser.interpolate('this is {numPeople, plural, =0 {no one} =1 {{gender, select, m {a man} f {a woman}}} other {everyone}}', {numPeople: '2', gender: 'm'}))
// console.log(parser.interpolate('this is {numPeople, plural, =0 {no one} =1 {{gender, select, m {a man} f {a woman}}} other {everyone}}', {numPeople: '2', gender: 'f'}))
//
// console.log(parser.interpolate('{n, plural, zero {zero} five {five} few {few} many {many}', {n: '0'}));
// console.log(parser.interpolate('{n, plural, zero {zero} five {five} few {few} many {many}', {n: '1'}));
// console.log(parser.interpolate('{n, plural, zero {zero} five {five} few {few} many {many}', {n: '2'}));
// console.log(parser.interpolate('{n, plural, zero {zero} five {five} few {few} many {many}', {n: '3'}));
// console.log(parser.interpolate('{n, plural, zero {zero} five {five} few {few} many {many}', {n: '4'}));
// console.log(parser.interpolate('{n, plural, zero {zero} five {five} few {few} many {many}', {n: '5'}));
// console.log(parser.interpolate('{n, plural, zero {zero} five {five} few {few} many {many}', {n: '10'}));
// console.log(parser.interpolate('{n, plural, zero {zero} five {five} few {few} many {many}', {n: '20'}));
// console.log(parser.interpolate('{n, plural, zero {zero} five {five} few {few} many {many}', {n: '25'}));
// console.log(parser.interpolate('{n, plural, zero {zero} few {few} many {many}', {n: '25'}));
