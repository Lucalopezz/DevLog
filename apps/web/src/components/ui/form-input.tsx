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
 * Campo de texto integrado ao React Hook Form.
 *
 * FormField conecta o input ao estado do formulário; os componentes abaixo
 * dele cuidam da associação semântica e da mensagem de validação em conjunto.
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
