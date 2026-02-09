'use client'

import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { COUNTRY_CODES } from '@/lib/country-codes'

interface PhoneInputProps {
  countryCode: string
  number: string
  onCountryCodeChange: (v: string) => void
  onNumberChange: (v: string) => void
  placeholder?: string
  disabled?: boolean
  id?: string
}

export function PhoneInput({
  countryCode,
  number,
  onCountryCodeChange,
  onNumberChange,
  placeholder = '99999-9999',
  disabled,
  id,
}: PhoneInputProps) {
  return (
    <div className="flex gap-2">
      <Select
        value={countryCode || '32'}
        onValueChange={onCountryCodeChange}
        disabled={disabled}
      >
        <SelectTrigger className="w-[110px] shrink-0">
          <SelectValue placeholder="+32" />
        </SelectTrigger>
        <SelectContent>
          {COUNTRY_CODES.map((c) => (
            <SelectItem key={c.code} value={c.code}>
              {c.flag} +{c.code}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        id={id}
        placeholder={placeholder}
        value={number}
        onChange={(e) => onNumberChange(e.target.value)}
        disabled={disabled}
        className="flex-1"
      />
    </div>
  )
}
