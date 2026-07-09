import type { SyncExpectationResult } from 'vitest';
import type { AssertIs } from '../AssertIs.ts';
import { assertVoidExpectedArgument } from './assertVoidExpectedArgument';
import { expandSimpleExpectExtensionResult } from './expandSimpleExpectExtensionResult';
import type { ExpectExtensionMethod } from './shared-extension-types';
import { validatedExtensionMethod } from './validatedExtensionMethod';

export class ArbitraryConditionExpectExtension<Parameter> {
  readonly extensionMethod: ExpectExtensionMethod<unknown, unknown, SyncExpectationResult>;

  constructor(
    readonly validateArgument: AssertIs<Parameter>,
    readonly arbitraryCondition: ExpectExtensionMethod<Parameter, void>
  ) {
    const validatedMethod = validatedExtensionMethod(
      validateArgument,
      assertVoidExpectedArgument,
      arbitraryCondition
    );

    this.extensionMethod = expandSimpleExpectExtensionResult(validatedMethod);
  }
}
