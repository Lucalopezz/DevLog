import type { Control, FieldPath, FieldValues } from 'react-hook-form'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { FormInput } from '@/components/ui/form-input'

type ProjectCommonFormValues = FieldValues & {
  name: string
  description?: string
}

type ProjectFormFieldsProps<TFieldValues extends ProjectCommonFormValues> = {
  // `control` connects the form created by the wrapper to each field:
  // it carries the value, onChange, error state, and accessibility rules.
  control: Control<TFieldValues>
  disabled?: boolean
}

/**
 * Fields shared by project creation and editing.
 *
 * The component only receives `control`, so the parent form still
 * chooses the schema, initial values, and mutation. This separation
 * avoids duplicate markup and keeps each flow responsible for its operation.
 */
export function ProjectFormFields<TFieldValues extends ProjectCommonFormValues>({
  control,
  disabled = false,
}: ProjectFormFieldsProps<TFieldValues>) {
  return (
    <>
      <FormInput
        autoComplete="off"
        control={control}
        disabled={disabled}
        label="Name"
        // The ProjectCommonFormValues constraint guarantees these fields; the assertion
        // adapts that guarantee to React Hook Form's recursive path type.
        name={'name' as FieldPath<TFieldValues>}
        placeholder="My project"
      />

      {/*
        FormField adapts the textarea to React Hook Form. The `field` received by
        render already contains the props needed to keep the value synchronized;
        therefore, the shared component does not need its own useState.
      */}
      <FormField
        control={control}
        name={'description' as FieldPath<TFieldValues>}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <textarea
                {...field}
                className="min-h-24 w-full resize-y rounded-lg border border-input bg-transparent px-2.5 py-2 text-base outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                disabled={disabled}
                placeholder="A brief project description"
                rows={4}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  )
}
