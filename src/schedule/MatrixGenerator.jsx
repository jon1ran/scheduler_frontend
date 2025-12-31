import "react"
import { useState } from "react"
import { useApi } from "../utils/api.js"

export function MatrixGenerator({ onScheduleGenerated }) {
    const [name, setName] = useState("")
    const [workers, setWorkers] = useState([
        { id: "w1", name: "Worker 1", unavailability: [] }
    ])
    const [rooms, setRooms] = useState([
        { id: "r1", name: "Room 1", capacity: 1 }
    ])
    const [assignments, setAssignments] = useState({
        "w1": []
    })
    const [settings, setSettings] = useState({
        startTime: "2025-01-01T09:00",
        endTime: "2025-01-01T17:00",
        meetingDuration: 25,
        restTime: 0
    })
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState(null)
    const { makeRequest } = useApi()

    const addWorker = () => {
        const newId = `w${workers.length + 1}`
        setWorkers([...workers, { id: newId, name: `Worker ${workers.length + 1}`, unavailability: [] }])
        setAssignments({ ...assignments, [newId]: [] })
    }

    const addRoom = () => {
        const newId = `r${rooms.length + 1}`
        setRooms([...rooms, { id: newId, name: `Room ${rooms.length + 1}`, capacity: 1 }])
    }

    const toggleAssignment = (workerId, roomId) => {
        const current = assignments[workerId] || []
        if (current.includes(roomId)) {
            setAssignments({ ...assignments, [workerId]: current.filter(id => id !== roomId) })
        } else {
            setAssignments({ ...assignments, [workerId]: [...current, roomId] })
        }
    }

    const handleWorkerSetting = (workerId) => {
        const hours = prompt("Enter unavailability hours (comma separated, e.g. 10,11,14):")
        if (hours === null) return;

        const unavailability = hours.split(",").map(h => {
            const hour = h.trim().padStart(2, "0")
            return {
                start: `2025-01-01T${hour}:00:00`,
                end: `2025-01-01T${hour}:59:59`
            }
        })
        setWorkers(workers.map(w => w.id === workerId ? { ...w, unavailability } : w))
    }

    const handleRoomSetting = (roomId) => {
        const capacity = prompt("Enter room capacity:", "1")
        if (capacity === null) return;
        setRooms(rooms.map(r => r.id === roomId ? { ...r, capacity: parseInt(capacity) || 1 } : r))
    }

    const updateWorkerName = (id, newName) => {
        setWorkers(workers.map(w => w.id === id ? { ...w, name: newName } : w))
    }

    const updateRoomName = (id, newName) => {
        setRooms(rooms.map(r => r.id === id ? { ...r, name: newName } : r))
    }

    const generate = async () => {
        setIsLoading(true)
        setError(null)
        try {
            const data = await makeRequest("generate-schedule", {
                method: "POST",
                body: JSON.stringify({
                    title: name,
                    workers,
                    rooms,
                    assignments,
                    settings: {
                        ...settings,
                        startTime: new Date(settings.startTime).toISOString(),
                        endTime: new Date(settings.endTime).toISOString()
                    }
                })
            })
            if (onScheduleGenerated) onScheduleGenerated(data)
        } catch (err) {
            setError(err.message || "Failed to generate schedule")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="matrix-generator">
            <div className="schedule-name-input">
                <label>Schedule Name</label>
                <input
                    type="text"
                    placeholder="e.g. Weekly Meeting Jan 1st"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="name-input"
                />
            </div>
            <div className="settings-grid">
                <div className="setting-item">
                    <label>Start Time</label>
                    <input type="datetime-local" value={settings.startTime} onChange={e => setSettings({ ...settings, startTime: e.target.value })} />
                </div>
                <div className="setting-item">
                    <label>End Time</label>
                    <input type="datetime-local" value={settings.endTime} onChange={e => setSettings({ ...settings, endTime: e.target.value })} />
                </div>
                <div className="setting-item">
                    <label>Meeting (min)</label>
                    <input type="number" value={settings.meetingDuration} onChange={e => setSettings({ ...settings, meetingDuration: parseInt(e.target.value) })} />
                </div>
                <div className="setting-item">
                    <label>Rest (min)</label>
                    <input type="number" value={settings.restTime} onChange={e => setSettings({ ...settings, restTime: parseInt(e.target.value) })} />
                </div>
            </div>

            <div className="matrix-controls">
                <button onClick={addWorker}>Add Worker</button>
                <button onClick={addRoom}>Add Room</button>
            </div>

            <div className="matrix-wrapper">
                <table className="matrix-table">
                    <thead>
                        <tr>
                            <th>Workers / Rooms</th>
                            {rooms.map(room => (
                                <th key={room.id}>
                                    <div className="header-cell">
                                        <input
                                            type="text"
                                            value={room.name}
                                            onChange={e => updateRoomName(room.id, e.target.value)}
                                            className="inline-name-input"
                                        />
                                        <button className="mini-btn" onClick={() => handleRoomSetting(room.id)} title="Capacity">⚙️({room.capacity})</button>
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {workers.map(worker => (
                            <tr key={worker.id}>
                                <td>
                                    <div className="row-header-cell">
                                        <input
                                            type="text"
                                            value={worker.name}
                                            onChange={e => updateWorkerName(worker.id, e.target.value)}
                                            className="inline-name-input"
                                        />
                                        <button className="mini-btn" onClick={() => handleWorkerSetting(worker.id)} title="Unavailability">⚙️</button>
                                    </div>
                                </td>
                                {rooms.map(room => (
                                    <td key={room.id} className="checkbox-cell">
                                        <input
                                            type="checkbox"
                                            checked={assignments[worker.id]?.includes(room.id)}
                                            onChange={() => toggleAssignment(worker.id, room.id)}
                                        />
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <button className="generate-button" onClick={generate} disabled={isLoading}>
                {isLoading ? "Generating..." : "Generate Schedule"}
            </button>

            {error && <div className="error-message">{error}</div>}
        </div>
    )
}
