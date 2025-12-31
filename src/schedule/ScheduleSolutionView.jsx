import "react"

export function ScheduleSolutionView({ requestJson, solution }) {
    if (!solution || !solution.workers_at_shifts) {
        return <div className="solution-view"><p>No solution data available. Status: {solution?.status || "Unknown"}</p></div>;
    }

    console.log("Solution:", solution);
    console.log("Request JSON:", requestJson);

    const request = JSON.parse(requestJson);
    const matrixRequest = request.worker_rostering_instance; // This is actually WorkerRosteringInstance in the DB

    // We need to map shift IDs to their details
    const shiftMap = {};
    matrixRequest.shifts.forEach(s => {
        shiftMap[s.uid] = s;
    });

    const workers = matrixRequest.workers;
    const rooms = matrixRequest.rooms;

    // Group shifts by room and then by time
    const roomAssignments = {};
    rooms.forEach(room => {
        roomAssignments[room.name] = matrixRequest.shifts
            .filter(s => s.room === room.name)
            .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
    });

    const getWorkerName = (uid) => {
        return workers.find(w => w.uid === uid)?.name || "Unknown";
    };

    return (
        <div className="solution-view">
            <h3>Generated Schedule</h3>
            <div className="solution-grid-wrapper">
                <table className="solution-table">
                    <thead>
                        <tr>
                            <th>Time Slot</th>
                            {rooms.map(room => (
                                <th key={room.name}>{room.name}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rooms.length > 0 && roomAssignments[rooms[0].name]
                            ? roomAssignments[rooms[0].name].map((shift, idx) => (
                                <tr key={idx}>
                                    <td className="time-cell">
                                        {new Date(shift.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                                        {new Date(shift.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                    {rooms.map(room => {
                                        const roomShift = roomAssignments[room.name][idx];
                                        const assignedWorkerUids = (roomShift && solution.workers_at_shifts[roomShift.uid]) || [];
                                        return (
                                            <td key={room.name} className="assignment-cell">
                                                {assignedWorkerUids.length > 0 ? (
                                                    assignedWorkerUids.map(uid => (
                                                        <div key={uid} className="assigned-worker-tag">
                                                            {getWorkerName(uid)}
                                                        </div>
                                                    ))
                                                ) : (
                                                    <span className="empty-slot">-</span>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))
                            : <tr><td colSpan={rooms.length + 1}>No shift data available in the request.</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
