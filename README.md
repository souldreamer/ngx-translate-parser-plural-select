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
