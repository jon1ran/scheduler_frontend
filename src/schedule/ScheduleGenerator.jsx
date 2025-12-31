import "react"
import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { MatrixGenerator } from "./MatrixGenerator.jsx";
import { useApi } from "../utils/api.js"

export function ScheduleGenerator() {
    const [taskStatus, setTaskStatus] = useState(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState(null)
    const [quota, setQuota] = useState(null)
    const { makeRequest } = useApi()
    const navigate = useNavigate()
    const pollingRef = useRef(null)

    useEffect(() => {
        fetchQuota()
    }, [])

    const fetchQuota = async () => {
        try {
            const data = await makeRequest("quota")
            setQuota(data)
        } catch (err) {
            console.log(err)
        }
    }

    const onScheduleGenerated = (data) => {
        setTaskStatus(data)
        fetchQuota()
    }


    // Polling logic
    // Polling logic
    useEffect(() => {
        // Continue polling if status exists and is NOT final (Completed or Failed)
        const isFinalStatus = taskStatus && ["Completed", "Failed"].includes(taskStatus.status)

        if (!taskStatus || isFinalStatus) {
            // Stop polling if no task or task finished
            if (pollingRef.current) {
                clearTimeout(pollingRef.current)
                pollingRef.current = null
            }
            return
        }

        const pollStatus = async () => {
            try {
                const taskId = taskStatus.task_id || taskStatus.taskId
                const data = await makeRequest(`schedule/${taskId}/status`)
                setTaskStatus(prev => ({ ...prev, ...data }))

                // If new status is NOT final, keep polling
                if (!["Completed", "Failed"].includes(data.status)) {
                    pollingRef.current = setTimeout(pollStatus, 2000)
                }
            } catch (err) {
                console.error("Polling error", err)
            }
        }

        pollingRef.current = setTimeout(pollStatus, 2000)

        return () => {
            if (pollingRef.current) clearTimeout(pollingRef.current)
        }
    }, [taskStatus, makeRequest])


    const getNextResetTime = () => {
        if (!quota?.last_reset_date) return null
        const resetDate = new Date(quota.last_reset_date)
        resetDate.setHours(resetDate.getHours() + 24)
        return resetDate
    }

    return <div className="schedule-container">
        <h2>Schedule Generator</h2>

        <div className="quota-display">
            <p>Schedules remaining today: {quota?.quota_remaining ?? 0}</p>
            {quota?.quota_remaining === 0 && quota?.last_reset_date && (
                <p>Next reset: {getNextResetTime()?.toLocaleString()}</p>
            )}
        </div>

        <MatrixGenerator onScheduleGenerated={onScheduleGenerated} />

        {taskStatus && (
            <div className="task-status-banner">
                <p>Job submitted!</p>
                <p>Status: <strong>{taskStatus.status}</strong></p>

                <button
                    className="generate-button"
                    style={{ marginTop: '1rem', width: 'auto' }}
                    onClick={() => navigate("/history", { state: { taskId: taskStatus.task_id || taskStatus.taskId } })}
                    disabled={taskStatus.status !== "Completed"}
                >
                    {taskStatus.status === "Completed" ? "Show Solution" : "Processing..."}
                </button>
            </div>
        )}

        {error && <div className="error-message">
            <p>{error}</p>
        </div>}
    </div>
}