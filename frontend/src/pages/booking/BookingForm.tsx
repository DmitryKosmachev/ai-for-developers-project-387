import { useState, type FormEvent } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export interface BookingFormValues {
  guestName: string
  guestEmail: string
  comment: string
}

interface BookingFormProps {
  disabled?: boolean
  isPending?: boolean
  onSubmit: (values: BookingFormValues) => void
}

interface FieldErrors {
  guestName?: string
  guestEmail?: string
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validate(values: BookingFormValues): FieldErrors {
  const errors: FieldErrors = {}
  if (!values.guestName.trim()) {
    errors.guestName = 'Укажите имя'
  }
  if (!values.guestEmail.trim()) {
    errors.guestEmail = 'Укажите email'
  } else if (!EMAIL_RE.test(values.guestEmail.trim())) {
    errors.guestEmail = 'Некорректный email'
  }
  return errors
}

export function BookingForm({
  disabled,
  isPending,
  onSubmit,
}: BookingFormProps) {
  const [values, setValues] = useState<BookingFormValues>({
    guestName: '',
    guestEmail: '',
    comment: '',
  })
  const [errors, setErrors] = useState<FieldErrors>({})
  const [touched, setTouched] = useState(false)

  function update<K extends keyof BookingFormValues>(
    key: K,
    value: BookingFormValues[K],
  ) {
    const next = { ...values, [key]: value }
    setValues(next)
    if (touched) setErrors(validate(next))
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const found = validate(values)
    setErrors(found)
    setTouched(true)
    if (Object.keys(found).length > 0) return
    onSubmit({
      guestName: values.guestName.trim(),
      guestEmail: values.guestEmail.trim(),
      comment: values.comment.trim(),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="guestName">
          Имя <span className="text-destructive">*</span>
        </Label>
        <Input
          id="guestName"
          value={values.guestName}
          onChange={(e) => update('guestName', e.target.value)}
          aria-invalid={Boolean(errors.guestName)}
          autoComplete="name"
          disabled={disabled || isPending}
        />
        {errors.guestName ? (
          <p className="text-sm text-destructive" role="alert">
            {errors.guestName}
          </p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="guestEmail">
          Email <span className="text-destructive">*</span>
        </Label>
        <Input
          id="guestEmail"
          type="email"
          value={values.guestEmail}
          onChange={(e) => update('guestEmail', e.target.value)}
          aria-invalid={Boolean(errors.guestEmail)}
          autoComplete="email"
          inputMode="email"
          disabled={disabled || isPending}
        />
        {errors.guestEmail ? (
          <p className="text-sm text-destructive" role="alert">
            {errors.guestEmail}
          </p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="comment">Комментарий</Label>
        <Textarea
          id="comment"
          value={values.comment}
          onChange={(e) => update('comment', e.target.value)}
          placeholder="Тема встречи или что обсудить (необязательно)"
          disabled={disabled || isPending}
        />
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={disabled || isPending}
      >
        {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
        Записаться
      </Button>
    </form>
  )
}
