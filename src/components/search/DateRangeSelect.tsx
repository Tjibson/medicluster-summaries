import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface DateRangeSelectProps {
  startDate: Date | undefined
  endDate: Date | undefined
  onStartDateChange: (date: Date | undefined) => void
  onEndDateChange: (date: Date | undefined) => void
  onQuickSelect: (days: number) => void
}

export function DateRangeSelect({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onQuickSelect,
}: DateRangeSelectProps) {
  return (
    <div className="space-y-2 col-span-2">
      <label className="text-sm font-medium">Date Range</label>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            onStartDateChange(undefined)
            onEndDateChange(undefined)
          }}
        >
          All time
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onQuickSelect(90)}
        >
          Last 90 days
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onQuickSelect(365)}
        >
          Last year
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onQuickSelect(1825)}
        >
          Last 5 years
        </Button>
      </div>
      <div className="flex gap-4 mt-2">
        <div className="flex-1">
          <label className="text-sm font-medium">Start Date</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={onStartDateChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex-1">
          <label className="text-sm font-medium">End Date</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !endDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={onEndDateChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  )
}