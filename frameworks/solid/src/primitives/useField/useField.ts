import {
  type FieldElement,
  type FormSchema,
  getElementInput,
  getFieldBool,
  getFieldInput,
  getFieldStore,
  INTERNAL,
  type RequiredPath,
  setFieldBool,
  setFieldInput,
  validateIfRequired,
  type ValidPath,
} from '@formisch/core/solid';
import { getOwner, onCleanup, runWithOwner, untrack } from 'solid-js';
import type * as v from 'valibot';
import type { FieldStore, FormStore, MaybeGetter } from '../../types/index.ts';
import { unwrap } from '../../utils/index.ts';

/**
 * Use field config interface.
 */
export interface UseFieldConfig<
  TSchema extends FormSchema = FormSchema,
  TFieldPath extends RequiredPath = RequiredPath,
> {
  /**
   * The path to the field within the form schema.
   */
  readonly path: ValidPath<v.InferInput<TSchema>, TFieldPath>;
}

/**
 * Creates a reactive field store for a specific field within a form store.
 *
 * @param form The form store instance.
 * @param config The field configuration.
 *
 * @returns The field store with reactive properties and element props.
 */
export function useField<
  TSchema extends FormSchema,
  TFieldPath extends RequiredPath,
>(
  form: MaybeGetter<FormStore<TSchema>>,
  config: MaybeGetter<UseFieldConfig<TSchema, TFieldPath>>
): FieldStore<TSchema, TFieldPath>;

// @__NO_SIDE_EFFECTS__
export function useField(
  form: MaybeGetter<FormStore>,
  config: MaybeGetter<UseFieldConfig>
): FieldStore {
  const fieldOwner = getOwner();
  const getPath = () => unwrap(config).path;
  const getInternalFormStore = () => unwrap(form)[INTERNAL];
  const getInternalFieldStore = () =>
    getFieldStore(getInternalFormStore(), getPath())!;

  return {
    get path() {
      return getPath();
    },
    get input() {
      return getFieldInput(getInternalFieldStore());
    },
    get errors() {
      return getInternalFieldStore().errors.value;
    },
    get isTouched() {
      return getFieldBool(getInternalFieldStore(), 'isTouched');
    },
    get isEdited() {
      return getFieldBool(getInternalFieldStore(), 'isEdited');
    },
    get isDirty() {
      return getFieldBool(getInternalFieldStore(), 'isDirty');
    },
    get isValid() {
      return !getFieldBool(getInternalFieldStore(), 'errors');
    },
    onInput(value) {
      setFieldInput(getInternalFormStore(), getPath(), value);
      validateIfRequired(
        getInternalFormStore(),
        getInternalFieldStore(),
        'input'
      );
    },
    props: {
      get name() {
        return getInternalFieldStore().name;
      },
      // eslint-disable-next-line solid/reactivity
      autofocus: untrack(() => !!getInternalFieldStore().errors.value),
      get ref() {
        // Capture the JSX scope while props are read, before ref runs unowned.
        const owner = getOwner() ?? fieldOwner;
        return (element: FieldElement) => {
          const internalFieldStore = getInternalFieldStore();
          // An array reorder transfers registered elements between the field
          // stores, so the element may already be present when the framework
          // re-registers it against the destination store
          if (!internalFieldStore.elements.includes(element)) {
            internalFieldStore.elements.push(element);
          }
          runWithOwner(owner, () =>
            onCleanup(() => {
              const elements = internalFieldStore.elements.filter(
                (el) => el !== element
              );
              // Keep `initialElements` in sync while the store still owns it
              // (same reference) and filter it separately otherwise, so the
              // detached element of a removed array item does not survive in the
              // reset baseline
              if (
                internalFieldStore.elements ===
                internalFieldStore.initialElements
              ) {
                internalFieldStore.initialElements = elements;
              } else {
                internalFieldStore.initialElements =
                  internalFieldStore.initialElements.filter(
                    (el) => el !== element
                  );
              }
              internalFieldStore.elements = elements;
            })
          );
        };
      },
      onFocus() {
        setFieldBool(getInternalFieldStore(), 'isTouched', true);
        validateIfRequired(
          getInternalFormStore(),
          getInternalFieldStore(),
          'touch'
        );
      },
      onInput(event) {
        const internalFieldStore = getInternalFieldStore();
        setFieldInput(
          getInternalFormStore(),
          getPath(),
          getElementInput(event.currentTarget, internalFieldStore)
        );
        validateIfRequired(getInternalFormStore(), internalFieldStore, 'input');
      },
      onChange() {
        validateIfRequired(
          getInternalFormStore(),
          getInternalFieldStore(),
          'change'
        );
      },
      onBlur() {
        validateIfRequired(
          getInternalFormStore(),
          getInternalFieldStore(),
          'blur'
        );
      },
    },
  };
}
