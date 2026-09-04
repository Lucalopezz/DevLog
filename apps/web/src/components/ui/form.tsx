import * as React from 'react'
import { Slot } from 'radix-ui'
import {
  Controller,
  FormProvider,
  useFormContext,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form'

import { cn } from '@/lib/utils'

const Form = FormProvider

const FormFieldContext = React.createContext<{
  name: FieldPath<FieldValues>
} | null>(null)

const FormItemContext = React.createContext<{ id: string } | null>(null)

function FormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({ ...props }: ControllerProps<TFieldValues, TName>) {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  )
}

function FormItem({ className, ...props }: React.ComponentProps<'div'>) {
  const id = React.useId()

  return (
    <FormItemContext.Provider value={{ id }}>
      <div
        data-slot="form-item"
        className={cn('space-y-2', className)}
        {...props}
      />
    </FormItemContext.Provider>
  )
}

function useFormField() {
  const fieldContext = React.useContext(FormFieldContext)
  const itemContext = React.useContext(FormItemContext)
  const form = useFormContext()

  if (!fieldContext) {
    throw new Error('useFormField must be used within a FormField')
  }

  if (!itemContext) {
    throw new Error('useFormField must be used within a FormItem')
  }

  const fieldState = form.getFieldState(fieldContext.name, form.formState)
  const formDescriptionId = `${itemContext.id}-description`
  const formMessageId = `${itemContext.id}-message`

  return {
    id: itemContext.id,
    name: fieldContext.name,
    formItemId: itemContext.id,
    formDescriptionId,
    formMessageId,
    error: fieldState.error,
  }
}

function FormLabel({ className, ...props }: React.ComponentProps<'label'>) {
  const { error, formItemId } = useFormField()

  return (
    <label
      data-slot="form-label"
      data-error={!!error}
      className={cn('text-sm font-medium', error && 'text-destructive', className)}
      htmlFor={formItemId}
      {...props}
    />
  )
}

function FormControl({ ...props }: React.ComponentProps<typeof Slot.Root>) {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField()
  const describedBy = error
    ? `${formDescriptionId} ${formMessageId}`
    : formDescriptionId

  return (
    <Slot.Root
      data-slot="form-control"
      id={formItemId}
      aria-describedby={describedBy}
      aria-invalid={!!error}
      {...props}
    />
  )
}

function FormMessage({ className, ...props }: React.ComponentProps<'p'>) {
  const { error, formMessageId } = useFormField()
  const body = error ? String(error.message ?? '') : props.children

  if (!body) {
    return null
  }

  return (
    <p
      data-slot="form-message"
      id={formMessageId}
      className={cn('text-sm text-destructive', className)}
      role="alert"
      {...props}
    >
      {body}
    </p>
  )
}

export {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
}

// O hook faz parte da API do padrão Form do shadcn, mas não é um componente.
// A exceção fica restrita a esta exportação para manter o Fast Refresh no restante do arquivo.
// eslint-disable-next-line react-refresh/only-export-components
export { useFormField }
