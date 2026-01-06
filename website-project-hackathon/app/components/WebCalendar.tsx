/**
 * Main calendar component
 */

import { useState, type MouseEvent } from "react"
import { Box, Button, Card, CardContent, CardHeader, Container, Divider} from "@mui/material"

import { Calendar, type Event, dateFnsLocalizer } from "react-big-calendar"

import {format} from "date-fns/format"
import {parse} from "date-fns/parse"
import {startOfWeek} from "date-fns/startOfWeek"
import {getDay} from "date-fns/getDay"
import {enUS} from "date-fns/locale/en-US"

import "react-big-calendar/lib/css/react-big-calendar.css"

import EventInfo from "./EventInfo"
import AddEvent from "./AddEvent"
import EventView from "./EventView"
import UpdateEvent from "./UpdateEvent"

const locales = {
  "en-US": enUS,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

const initialDatePickerEventFormData: DatePickerEventFormData = {
  description: "",
  id: undefined,
  allDay: false,
  start: undefined,
  end: undefined,
}

const initialEventFormState: EventFormData = {
  description: "",
  id: undefined,
}

export function WebCalendar() {
    const [openSlot, setOpenSlot] = useState(false)
    const [currentEvent, setCurrentEvent] = useState<Event | IEventInfo | null>(null)

    const [eventView, setEventView] = useState(false)
    const [updateEvent, setUpdateEvent] = useState(false)

    const [events, setEvents] = useState<IEventInfo[]>([])

    const [eventFormData, setEventFormData] = useState<EventFormData>(initialEventFormState)

    const [datePickerEventFormData, setDatePickerEventFormData] = useState<DatePickerEventFormData>(initialDatePickerEventFormData)

    const [chatMsgs, setChatMsgs] = useState<{sender: "ai" | "user", msg: string}[]>([])
    const [chatInput, setChatInput] = useState<string>("")


    // AI chat
    const sendMessage = () => {
      if (!chatInput.trim()) return

      setChatMsgs(prev => [...prev, {sender: "user", msg: chatInput.trim()}])

      setTimeout(() => 
      {
        setChatMsgs(prev => [...prev, {sender: "ai", msg: "AI response."}])
      }, 500)

      setChatInput("");
    }



    //calendar


    const handleSelectSlot = (event: Event) => {
      setOpenSlot(true)
      setCurrentEvent(event)
    }

    const handleSelectEvent = (event: IEventInfo) => {
      setCurrentEvent(event)
      setEventView(true)
    }

    const handleClose = () => {
      setEventFormData(initialEventFormState)
      setOpenSlot(false)
    }

    const handleUpdateEventClose = () => {
      setDatePickerEventFormData(initialDatePickerEventFormData)
      setUpdateEvent(false)
    }

    const onAddEvent = (e: MouseEvent<HTMLButtonElement>) => {
      e.preventDefault()

      const data: IEventInfo = {
        ...eventFormData,
        _id: generateId(),
        start: currentEvent?.start,
        end: currentEvent?.end,
      }

      const newEvents = [...events, data]

      setEvents(newEvents)
      handleClose()
    }

    const onUpdateEvent = (e: MouseEvent<HTMLButtonElement>) => {
      e.preventDefault()
      const curEv = currentEvent as IEventInfo

      const addHours = (date: Date | undefined, hours: number) => {
        return date ? date.setHours(date.getHours() + hours) : undefined
      }

      const setMinToZero = (date: any) => {
        date.setSeconds(0)

        return date
      }

      const data: IEventInfo = {
        ...datePickerEventFormData,
        _id: curEv._id,
        start: setMinToZero(datePickerEventFormData.start),
        end: datePickerEventFormData.allDay
            ? addHours(datePickerEventFormData.start, 12)
            : setMinToZero(datePickerEventFormData.end),
      }

      const curEventIndex = events.findIndex(ev => ev._id === curEv._id)
      let copyEvents = [...events]
      copyEvents[curEventIndex] = {...data};
      setEvents(copyEvents)
      setDatePickerEventFormData(initialDatePickerEventFormData)
      setUpdateEvent(false)
    }

    const onDeleteEvent = () => {
      setEvents(() => [...events].filter((e) => e._id !== (currentEvent as IEventInfo)._id!))
      setEventView(false)
    }
    
    return (
    <Box
      mt={2}
      mb={2}
      component="main"
      sx={{
        flexGrow: 1,
        py: 8,
      }}
    >
      <Container maxWidth={false}>
        <Card>
          <CardHeader title="Calendar" subheader="Create Events and manage them easily" />
          <Divider />
          <CardContent>
          <Box sx={{ display: "flex"}}>
            <Box sx = {{ flex: 3 , pr: 2}}>
              <AddEvent
                open={openSlot}
                handleClose={handleClose}
                eventFormData={eventFormData}
                setEventFormData={setEventFormData}
                onAddEvent={onAddEvent}
              />
              <UpdateEvent 
                open={updateEvent}
                handleClose={handleUpdateEventClose}
                event={currentEvent as IEventInfo}
                datePickerEventFormData={datePickerEventFormData}
                setDatePickerEventFormData={setDatePickerEventFormData}
                onUpdateEvent={onUpdateEvent}
              />
              <EventView
                open={eventView}
                handleClose={() => setEventView(false)}
                onDeleteEvent={onDeleteEvent}
                setUpdateEvent={setUpdateEvent}
                currentEvent={currentEvent as IEventInfo}
              />
              <Calendar
                localizer={localizer}
                events={events}
                onSelectEvent={handleSelectEvent}
                onSelectSlot={handleSelectSlot}
                selectable
                startAccessor="start"
                components={{ event: EventInfo }}
                endAccessor="end"
                defaultView="week"
                style={{
                  height: 900,
                }}
              />
            </Box>
            <Box
                sx={{
                  flex: 1,
                  borderLeft: "1px solid #ddd",
                  pl: 2,
                  display: "flex",
                  borderRadius: 2, p: 4,
                  flexDirection: "column",
                  height: "900px",
                  boxShadow: "0 0 10px rgba(0,0,0,0.1)"
                }}>
                  <h3>AI Chat</h3>
                  <Box
                    sx={{
                      flex: 1,
                      overflowY: "auto",
                      mb: 1,
                      p: 1,
                      border: "1px solid #ccc",
                    }}
                  >
                    {chatMsgs.map((msg, i) => (
                      <div key={i}>
                        <span
                          style={{
                            fontWeight: "bold",
                            color: msg.sender === "ai" ? "green" : "inherit",
                            marginRight: 4
                          }}
                        >
                          {msg.sender === "ai" ? "> " : ""}
                        </span>
                        {msg.msg}</div>
                    ))}
                  </Box>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <input
                      style={{ flex: 1, padding: 8 }}
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Ask about your calendar..."
                      onKeyDown={(e) => {
                        if (e.key === "Enter")
                        {
                          sendMessage();
                          e.preventDefault();
                        }
                      }}
                    />
                    <Button variant="contained" onClick={sendMessage}>
                      Send
                    </Button>
                  </Box>
                </Box>
              </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  )
}

export interface IEventInfo extends Event {
  _id: string
  description: string
}

export interface EventFormData {
  description: string
  id?: string
}

export interface DatePickerEventFormData {
  description: string
  id?: string
  allDay: boolean
  start?: Date
  end?: Date
}

export const generateId = () => (Math.floor(Math.random() * 10000) + 1).toString()