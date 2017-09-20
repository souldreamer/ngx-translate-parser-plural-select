/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

// from: https://github.com/angular/angular/blob/master/packages/core/src/type.ts

/**
 * @whatItDoes Represents a type that a Component or other object is instances of.
 *
 * @description
 *
 * An example of a `Type` is `MyCustomComponent` class, which in JavaScript is be represented by
 * the `MyCustomComponent` constructor function.
 *
 * @stable
 */
export const Type = Function;

export function isType(v: any): v is Type<any> {
	return typeof v === 'function';
}

export interface Type<T> extends Function { new (...args: any[]): T; }

// from: https://github.com/angular/angular/blob/master/packages/core/src/util/decorators.ts

/**
 * An interface implemented by all Angular type decorators, which allows them to be used as ES7
 * decorators as well as
 * Angular DSL syntax.
 *
 * ES7 syntax:
 *
 * ```
 * @ng.Component({...})
 * class MyClass {...}
 * ```
 * @stable
 */
export interface TypeDecorator {
	/**
	 * Invoke as ES7 decorator.
	 */
		<T extends Type<any>>(type: T): T;
	
	// Make TypeDecorator assignable to built-in ParameterDecorator type.
	// ParameterDecorator is declared in lib.d.ts as a `declare type`
	// so we cannot declare this interface as a subtype.
	// see https://github.com/angular/angular/issues/3379#issuecomment-126169417
	(target: Object, propertyKey?: string|symbol, parameterIndex?: number): void;
}

export const ANNOTATIONS = '__annotations__';
export const PARAMETERS = '__paramaters__';
export const PROP_METADATA = '__prop__metadata__';

/**
 * @suppress {globalThis}
 */
export function makeDecorator(
	name: string, props?: (...args: any[]) => any, parentClass?: any,
	chainFn?: (fn: Function) => void):
{new (...args: any[]): any; (...args: any[]): any; (...args: any[]): (cls: any) => any;} {
	const metaCtor = makeMetadataCtor(props);
	
	function DecoratorFactory(objOrType: any): (cls: any) => any {
		if (this instanceof DecoratorFactory) {
			metaCtor.call(this, objOrType);
			return this;
		}
		
		const annotationInstance = new (<any>DecoratorFactory)(objOrType);
		const TypeDecorator: TypeDecorator = <TypeDecorator>function TypeDecorator(cls: Type<any>) {
			// Use of Object.defineProperty is important since it creates non-enumerable property which
			// prevents the property is copied during subclassing.
			const annotations = cls.hasOwnProperty(ANNOTATIONS) ?
				(cls as any)[ANNOTATIONS] :
				Object.defineProperty(cls, ANNOTATIONS, {value: []})[ANNOTATIONS];
			annotations.push(annotationInstance);
			return cls;
		};
		if (chainFn) chainFn(TypeDecorator);
		return TypeDecorator;
	}
	
	if (parentClass) {
		DecoratorFactory.prototype = Object.create(parentClass.prototype);
	}
	
	DecoratorFactory.prototype.ngMetadataName = name;
	(<any>DecoratorFactory).annotationCls = DecoratorFactory;
	return DecoratorFactory as any;
}

function makeMetadataCtor(props?: (...args: any[]) => any): any {
	return function ctor(...args: any[]) {
		if (props) {
			const values = props(...args);
			for (const propName in values) {
				this[propName] = values[propName];
			}
		}
	};
}

export function makeParamDecorator(
	name: string, props?: (...args: any[]) => any, parentClass?: any): any {
	const metaCtor = makeMetadataCtor(props);
	function ParamDecoratorFactory(...args: any[]): any {
		if (this instanceof ParamDecoratorFactory) {
			metaCtor.apply(this, args);
			return this;
		}
		const annotationInstance = new (<any>ParamDecoratorFactory)(...args);
		
		(<any>ParamDecorator).annotation = annotationInstance;
		return ParamDecorator;
		
		function ParamDecorator(cls: any, unusedKey: any, index: number): any {
			// Use of Object.defineProperty is important since it creates non-enumerable property which
			// prevents the property is copied during subclassing.
			const parameters = cls.hasOwnProperty(PARAMETERS) ?
				(cls as any)[PARAMETERS] :
				Object.defineProperty(cls, PARAMETERS, {value: []})[PARAMETERS];
			
			// there might be gaps if some in between parameters do not have annotations.
			// we pad with nulls.
			while (parameters.length <= index) {
				parameters.push(null);
			}
			
			(parameters[index] = parameters[index] || []).push(annotationInstance);
			return cls;
		}
	}
	if (parentClass) {
		ParamDecoratorFactory.prototype = Object.create(parentClass.prototype);
	}
	ParamDecoratorFactory.prototype.ngMetadataName = name;
	(<any>ParamDecoratorFactory).annotationCls = ParamDecoratorFactory;
	return ParamDecoratorFactory;
}

export function makePropDecorator(
	name: string, props?: (...args: any[]) => any, parentClass?: any): any {
	const metaCtor = makeMetadataCtor(props);
	
	function PropDecoratorFactory(...args: any[]): any {
		if (this instanceof PropDecoratorFactory) {
			metaCtor.apply(this, args);
			return this;
		}
		
		const decoratorInstance = new (<any>PropDecoratorFactory)(...args);
		
		return function PropDecorator(target: any, name: string) {
			const constructor = target.constructor;
			// Use of Object.defineProperty is important since it creates non-enumerable property which
			// prevents the property is copied during subclassing.
			const meta = constructor.hasOwnProperty(PROP_METADATA) ?
				(constructor as any)[PROP_METADATA] :
				Object.defineProperty(constructor, PROP_METADATA, {value: {}})[PROP_METADATA];
			meta[name] = meta.hasOwnProperty(name) && meta[name] || [];
			meta[name].unshift(decoratorInstance);
		};
	}
	
	if (parentClass) {
		PropDecoratorFactory.prototype = Object.create(parentClass.prototype);
	}
	
	PropDecoratorFactory.prototype.ngMetadataName = name;
	(<any>PropDecoratorFactory).annotationCls = PropDecoratorFactory;
	return PropDecoratorFactory;
}



// from: https://github.com/angular/angular/blob/master/packages/core/src/di/metadata.ts

/**
 * Type of the Optional decorator / constructor function.
 *
 * @stable
 */
export interface OptionalDecorator {
	/**
	 * @whatItDoes A parameter metadata that marks a dependency as optional.
	 * {@link Injector} provides `null` if the dependency is not found.
	 * @howToUse
	 * ```
	 * @Injectable()
	 * class Car {
   *   constructor(@Optional() public engine:Engine) {}
   * }
	 * ```
	 *
	 * @description
	 * For more details, see the {@linkDocs guide/dependency-injection "Dependency Injection Guide"}.
	 *
	 * ### Example
	 *
	 * {@example core/di/ts/metadata_spec.ts region='Optional'}
	 *
	 * @stable
	 */
	(): any;
	new (): Optional;
}

/**
 * Type of the Optional metadata.
 *
 * @stable
 */
export interface Optional {}

/**
 * Optional decorator and metadata.
 *
 * @stable
 * @Annotation
 */
export const Optional: OptionalDecorator = makeParamDecorator('Optional');

/**
 * Type of the Injectable decorator / constructor function.
 *
 * @stable
 */
export interface InjectableDecorator {
	/**
	 * @whatItDoes A marker metadata that marks a class as available to {@link Injector} for creation.
	 * @howToUse
	 * ```
	 * @Injectable()
	 * class Car {}
	 * ```
	 *
	 * @description
	 * For more details, see the {@linkDocs guide/dependency-injection "Dependency Injection Guide"}.
	 *
	 * ### Example
	 *
	 * {@example core/di/ts/metadata_spec.ts region='Injectable'}
	 *
	 * {@link Injector} will throw an error when trying to instantiate a class that
	 * does not have `@Injectable` marker, as shown in the example below.
	 *
	 * {@example core/di/ts/metadata_spec.ts region='InjectableThrows'}
	 *
	 * @stable
	 */
	(): any;
	new (): Injectable;
}

/**
 * Type of the Injectable metadata.
 *
 * @stable
 */
export interface Injectable {}

/**
 * Injectable decorator and metadata.
 *
 * @stable
 * @Annotation
 */
export const Injectable: InjectableDecorator = makeDecorator('Injectable');

