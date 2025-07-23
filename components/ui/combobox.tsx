"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Plus } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface ComboboxProps {
  options: Array<{ value: string; label: string }>
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  allowCustom?: boolean
  onAddNew?: (value: string) => void
  className?: string
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Select option...",
  searchPlaceholder = "Search...",
  emptyText = "No option found.",
  allowCustom = false,
  onAddNew,
  className,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState("")

  const filteredOptions = options.filter((option) => option.label.toLowerCase().includes(searchValue.toLowerCase()))

  const showAddNewOption =
    allowCustom &&
    searchValue &&
    !filteredOptions.some((option) => option.value.toLowerCase() === searchValue.toLowerCase())

  const selectedOption = options.find((option) => option.value === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between bg-background hover:bg-accent hover:text-accent-foreground text-left font-normal border-input",
            !value && "text-muted-foreground",
            className,
          )}
        >
          <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full min-w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput
            placeholder={searchPlaceholder}
            value={searchValue}
            onValueChange={setSearchValue}
            className="h-9"
          />
          <CommandList>
            <CommandEmpty>
              {showAddNewOption ? (
                <div className="p-2">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-sm hover:bg-accent hover:text-accent-foreground"
                    onClick={() => {
                      if (onAddNew) {
                        onAddNew(searchValue)
                        onValueChange(searchValue)
                        setOpen(false)
                        setSearchValue("")
                      }
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add "{searchValue}"
                  </Button>
                </div>
              ) : (
                <div className="p-4 text-sm text-center text-muted-foreground">{emptyText}</div>
              )}
            </CommandEmpty>
            <CommandGroup>
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={(currentValue) => {
                    onValueChange(currentValue === value ? "" : currentValue)
                    setOpen(false)
                    setSearchValue("")
                  }}
                  className="text-sm cursor-pointer"
                >
                  <Check className={cn("mr-2 h-4 w-4", value === option.value ? "opacity-100" : "opacity-0")} />
                  <span className="truncate">{option.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
