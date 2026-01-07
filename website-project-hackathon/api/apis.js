import axios from 'axios'

const createEvent = async (e) => {
    console.log("creating event with: ", e);
    const body = {
        id: e._id,
        description: e.description,
        startDate: e.start?.toString(),
        endDate: e.end?.toString(),
        // startDate: JSON.stringify(e.start),
        // endDate: JSON.stringify(e.end),
        allDay: e.allDay,
    }
    console.log("body: ", body);
    await axios.post("https://tbq1zmwh88.execute-api.us-east-2.amazonaws.com/test/createEvent", body);
}

const getEvents = async () => {
    return await axios.get("https://tbq1zmwh88.execute-api.us-east-2.amazonaws.com/test/getEvents");
}

const upEvent = async (e) => {
    console.log("updating event with: ", e);
    const body = {
        id: e._id,
        description: e.description,
        startDate: e.start?.toString(),
        endDate: e.end?.toString(),
        // startDate: JSON.stringify(e.start),
        // endDate: JSON.stringify(e.end),
        allDay: e.allDay,
    }
    console.log("body: ", body);
    await axios.put("https://tbq1zmwh88.execute-api.us-east-2.amazonaws.com/test/updateEvent", body);
}

const deleteEvent = async (e) => {
    console.log("deleting event with: ", e);
    const body = {
        id: e._id
    }
    console.log("body: ", body);
    await axios.delete("https://tbq1zmwh88.execute-api.us-east-2.amazonaws.com/test/deleteEvent", body);
}

export {
    getEvents,
    createEvent,
    upEvent,
    deleteEvent,
};