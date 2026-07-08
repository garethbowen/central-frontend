import type { ExpandUnion } from '@getodk/common/types/helpers.d';
import type { BindType } from '../parse/model/BindTypeDefinition.ts';

export type ValueType = ExpandUnion<BindType>;
