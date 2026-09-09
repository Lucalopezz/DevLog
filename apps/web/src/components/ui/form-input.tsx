import * as React from 'react'
import {
  type Control,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form'

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'

type FormInputProps<TFieldValues extends FieldValues> = Omit<
  React.ComponentProps<typeof Input>,
  'name'
> & {
  control: Control<TFieldValues>
  label: string
  name: FieldPath<TFieldValues>
}

/**
 * Text field integrated with React Hook Form.
 *
 * FormField connects the input to form state; its child components
 * work together to provide semantic associations and validation messages.
 */
function FormInput<TFieldValues extends FieldValues>({
  control,
  label,
  name,
  ...inputProps
}: FormInputProps<TFieldValues>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input {...inputProps} {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export { FormInput }
