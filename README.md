# Template parser for `ngx-translate`

## Installation
Just `yarn install ngx-translate-parser-plural-select` and use when
adding `ngx-translate` to the `imports` section in your `@NgModule`:

```typescript
@NgModule({
    ...
    imports: [
    	...
        TranslateModule.forRoot({
            parser: {
            	provide: TranslateParser,
            	useClass: TranslateICUParser
            }
        })
    ]
})
```

## Usage
Now you can use `plural` and `select` in your translations.

```json
{
    "HERO": "The hero is {gender, select, m {male} f {female}}",
    "WOLVES": "The hero saw {wolves, plural, =0 {no wolf} =1 {a wolf} =2 {two wolves} other {a pack of wolves}}",
    "CROWS": "You could see {crows.length, plural, =1 {a crow} few {a few crows} many {a murder of crows}}"
}
```

And even more complex usages:
```json
{
    "COMPLEX": "{count, plural, =0 { nadie } =1 {{gender, select, m {un hombre} f {una mujer}}} other {{{heroes.length}} {gender, select, m {hombres} f {mujeres}}}}"
}
```

## Notes
Plural supports (first rule matching the value will be applied):
* `=value` &mdash; matches exact value (e.g. `=0`, `=1`)
* `zero`, `one`, `two`... &mdash; matches values ending in 0, 1, 2, ... that are not between 10 and 19 (inclusive)
* `few` &mdash; matches 2, 3, and 4
* `many` &mdash; matches any value greater than 4 and any non-integer value
* `other` &mdash; matches any value

## Custom pipes [`v1.1+`]
If you want to define your own pipes to use as `{variable, *pipe_name*, *pipe_options*}`, you can use a factory to
create the `TranslateICUParser`, the class taking an optional parameter consisting of a dictionary of custom pipes.

##### Example
```typescript
@NgModule({
    ...
    imports: [
    	...
        TranslateModule.forRoot({
            parser: {
            	provide: TranslateParser,
            	useFactory: createParserFactory
            }
        })
    ]
})
...

const CUSTOM_PIPES = {
    '?': (value: any, parameters: string[], options: string[]) => {
        parameters = parameters.map(option => option.trim()).slice(0, parameters.length - 1);
        const mapper: {[option: string]: string} = parameters.reduce((map, parameter, index) => ({...map, [parameter.trim()]: options[index]}), {});
        console.dir({value, parameters, options, mapper}, {depth: 10});
        return mapper[value] == null ? mapper[''] : mapper[':'];
    }
};

export function createParserFactory() {
	return new TranslateICUParser(CUSTOM_PIPES);
}
```

This allows you to use the `?` pipe:

`Hello, {name, ?, {{name}} : {stranger}}!`

##### Pipe function parameters

The parameters given to the pipe function are:
* the value of the variable the pipe is being applied on
* an array of the strings between the options
* an array of the options,

where the application of the pipe is on a string of the format
{*value*, *pipe_name*, *parameter0* {*option0*} *parameter1* {*option1*} ... *parameterN* {*optionN*} *parameterN+1*}

###### Concretely:
During the parsing of the string `'Hello, {name, myPipe, J {Johnny} K {Kenny} L {Lenny} M {Maurice}}'`,
the pipe defined in the dictionary passed to the `TranslateICUParser` class constructor under the `myPipe` key
will be called with parameters:
1. the value of the `name` property of the object passed to the `ngx-translate` function/directive
2. `[' J ', ' K ', ' L ', ' M ', '']`
3. `['Johnny', 'Kenny', 'Lenny', 'Maurice']`
