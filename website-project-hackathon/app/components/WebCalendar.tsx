
/**
 * Main calendar component
 */

import { useState, useEffect, type MouseEvent, useCallback } from "react"
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
import {createEvent, deleteEvent, getEvents, upEvent} from "../../api/apis.js"

const AI_ENDPOINT = "https://hlxgzmmk44.execute-api.us-east-2.amazonaws.com/default/AIChatbot"


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

    // const postEvent = useCallback(async () => {
    //   const newEvent = events.
    //   await createEvent()
    // }, [])

    const convertResponse = (e: {id: string, description: string, allDay: boolean, startDate: string, endDate: string}[]) => {
      const converted: IEventInfo[] = [];
      for (let i = 0; i < e.length; i++) {
        const event = e[i];
        // const newStartDate = event.start || new Date();
        const newStart = event.startDate ? new Date(event.startDate) : undefined;
        const newEnd = event.endDate ? new Date(event.endDate) : undefined;
        const converedEvent: IEventInfo = {
          _id: event.id,
          description: event.description,
          allDay: event.allDay,
          start: newStart,
          end: newEnd,
        }
        converted.push(converedEvent);
      }
      // console.log("converted: ", converted);
      return converted;
    }
    
    useEffect(() => {
      const fetchEvents = async () => {
        const response = await getEvents();
        const data = response.data;
        const parsedData = convertResponse(data);
        console.log(JSON.stringify(response.data));
        console.log(data);
        setEvents(parsedData);
        console.log(events);
      }
      fetchEvents();
    }, []);

    useEffect(() => {
      console.log('events:', events);
    }, [events]);

    const postEvent = useCallback(async (e: IEventInfo) => {
      console.log("calling postEvent...");
      createEvent(e);
    }, []);

    const putEvent = useCallback(async (e: IEventInfo) => {
      upEvent(e);
    }, []);

    const delEvent = useCallback(async (e: IEventInfo) => {
      deleteEvent(e);
    }, []);


    // AI chat
    const submitAIRequest = async () => {
      const packets = {
        userRequest: chatInput.trim(),
        now: new Date().toISOString(),
        timezone: "America/New_York",
        events: events.map(e => ({
          _id: e._id,
          description: e.description,
          start: e.start ? (e.start instanceof Date ? e.start : new Date(e.start)).toISOString() : null,
          end: e.end ? (e.end instanceof Date ? e.end : new Date(e.end)).toISOString() : null,
          allDay: !!e.allDay,
      })),
    };

    const res = await fetch(AI_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(packets),
    });

    const preaction = await res.json();
    const action = preaction.action


      const addEventAndPersist = async (event: IEventInfo) => {
        const saved = await createEvent(event);
        setEvents(prev => [...prev, saved]);
      };
      
      const updateEventAndPersist = async (event: IEventInfo) => {
        const saved = await upEvent(event);
        setEvents(prev =>
          prev.map(e => (e._id === saved._id ? saved : e))
        );
      };
      
      const deleteEventAndPersist = async (event: IEventInfo) => {
        await deleteEvent(event);
        setEvents(prev => prev.filter(e => e._id !== event._id));
      };


      
      if (action && action.type === "calendar.deleteEvent") {
        const eventIdToDelete = action.args._id
        const foundEvent = events.find(x => x._id === eventIdToDelete)
        const eventDescription = foundEvent?.description
        await deleteEventAndPersist(foundEvent);
        sendMessage("ai", `Deleted event: ${eventDescription}`)

      } else if (action && action.type === "calendar.addEvent") {
        const {description, start, end, allDay} = action.args
        const newEvent: IEventInfo = {
          _id: generateId(),
          description,
          start: new Date(start),
          end: new Date(end),
          allDay: allDay ?? false
        }
        await addEventAndPersist(newEvent)
        sendMessage("ai", `Added event: ${description} from ${start} to ${end}`)
      }
      else if (action && action.type === "calendar.updateEvent") {
        const {_id, description, start, end, allDay} = action.args
        const eventIndex = events.findIndex(i => i._id === _id)
        if (eventIndex !== -1) {
          const newEvent: IEventInfo = {
            _id,
            description,
            start: new Date(start),
            end: new Date(end),
            allDay: allDay ?? false
          }

          await updateEventAndPersist(newEvent);

          sendMessage("ai", `Updated event: ${description} from ${start} to ${end}`)
        }
      }
      else {
        sendMessage("ai", "No valid action found in AI response.")
      }
    }

    const sendMessage = (author: "user" | "ai", msg="") => {
      if (msg && author === "ai")
        setChatMsgs(prev => [...prev, {sender: author, msg: msg}])
      else if (author === "user")
      {
        if (!chatInput.trim()) return
        //what to send to AI bot
        if (!chatInput.trim()) return;

        setChatMsgs(prev => [...prev, { sender: author, msg: chatInput.trim() }]);
        submitAIRequest();
        setChatInput("");
        
      }
    }

    type CalendarAction =  { 
      type: "calendar.deleteEvent"
      args: { _id: string }
    }
    |
    {
      type: "calendar.addEvent"
      args: { description: string, start: string, end: string, allDay: boolean}
    }
    |
    {
      type: "calendar.updateEvent"
      args: { _id: string, description: string, start: string, end: string, allDay: boolean }
    }

    function tryParseAction(text: string): CalendarAction | null {
      try {
        const obj = JSON.parse(text);
        if (obj.type === "calendar.deleteEvent" && typeof obj.args._id === "string") {
          return obj;
        }
        if (obj.type === "calendar.addEvent" &&
          typeof obj.args.description === "string" &&
          typeof obj.args.start === "string" &&
          typeof obj.args.end === "string" &&
          typeof obj.args.allDay === "boolean") {
          return obj;
        }
        if (obj.type === "calendar.updateEvent" &&
          typeof obj.args.description === "string" &&
          typeof obj.args.start === "string" &&
          typeof obj.args.end === "string" &&
          typeof obj.args._id === "string" &&
          typeof obj.args.allDay === "boolean"
        )
        {
          return obj;
        }

        return null;
      } catch {
        return null;
      }
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
      postEvent(data);
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
      putEvent(data);
      setEvents(copyEvents)
      setDatePickerEventFormData(initialDatePickerEventFormData)
      setUpdateEvent(false)
    }

    const onDeleteEvent = () => {
      const curEv = currentEvent as IEventInfo;
      delEvent(curEv);
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
                          sendMessage("user");
                          
                          e.preventDefault();
                        }
                      }}
                    />
                    <Button variant="contained" onClick={() => sendMessage("user")}>
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
