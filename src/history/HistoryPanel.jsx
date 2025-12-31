import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ScheduleSolutionView } from "../schedule/ScheduleSolutionView.jsx";
import { useApi } from "../utils/api.js";

export function HistoryPanel() {
    const { makeRequest } = useApi();
    const [history, setHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedSchedule, setSelectedSchedule] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [editTitle, setEditTitle] = useState("");
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        fetchHistory();
    }, []);

    useEffect(() => {
        if (location.state?.taskId && history.length > 0) {
            const targetSchedule = history.find(s => s.task_id === location.state.taskId);
            if (targetSchedule) {
                setSelectedSchedule(targetSchedule);
                navigate(location.pathname, { replace: true, state: {} });
            }
        }
    }, [history, location.state, navigate]);

    const fetchHistory = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await makeRequest("my-history");
            setHistory(data.schedules);
        } catch (err) {
            setError("Failed to load history.");
        } finally {
            setIsLoading(false);
        }
    };

    const deleteSchedule = async (taskId) => {
        if (!window.confirm("Are you sure you want to remove this schedule from history?")) return;

        try {
            await makeRequest(`history/${taskId}/delete`, { method: "POST" });
            setHistory(history.filter(h => h.task_id !== taskId));
            if (selectedSchedule?.task_id === taskId) {
                setSelectedSchedule(null);
            }
        } catch (err) {
            alert("Failed to delete schedule");
        }
    };

    const renameSchedule = async (taskId, newTitle) => {
        if (!newTitle || newTitle === history.find(h => h.task_id === taskId)?.title) {
            setEditingId(null);
            return;
        }

        try {
            await makeRequest(`history/${taskId}/rename`, {
                method: "POST",
                body: JSON.stringify({ new_title: newTitle })
            });
            setHistory(history.map(h => h.task_id === taskId ? { ...h, title: newTitle } : h));
            if (selectedSchedule?.task_id === taskId) {
                setSelectedSchedule({ ...selectedSchedule, title: newTitle });
            }
        } catch (err) {
            alert("Failed to rename schedule");
        } finally {
            setEditingId(null);
        }
    };

    const startEditing = (schedule) => {
        setEditingId(schedule.task_id);
        setEditTitle(schedule.title || "Matrix Schedule");
    };

    const handleKeyDown = (e, taskId) => {
        if (e.key === 'Enter') {
            renameSchedule(taskId, editTitle);
        } else if (e.key === 'Escape') {
            setEditingId(null);
        }
    };;

    if (isLoading) {
        return <div className="loading">Loading history...</div>;
    }

    if (error) {
        return (
            <div className="error-message">
                <p>{error}</p>
                <button onClick={fetchHistory}>Retry</button>
            </div>
        );
    }

    return (
        <div className="history-panel">
            <h2>History</h2>
            {selectedSchedule ? (
                <div className="selected-history-view">
                    <button className="back-btn" onClick={() => setSelectedSchedule(null)}>← Back to History</button>
                    <div className="history-header">
                        <h3>{selectedSchedule.title || "Untitled Schedule"}</h3>
                        <p className="timestamp">Created: {new Date(selectedSchedule.date_created).toLocaleString()}</p>
                    </div>
                    <ScheduleSolutionView
                        requestJson={selectedSchedule.request_json}
                        solution={selectedSchedule.solution ? JSON.parse(selectedSchedule.solution) : null}
                    />
                </div>
            ) : (
                <>
                    {history.length === 0 ? <p>No schedule history</p> :
                        <div className="history-list">
                            {history.map((schedule) => (
                                <div className="history-item matrix-job" key={schedule.id}>
                                    <button
                                        className="delete-icon-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteSchedule(schedule.task_id);
                                        }}
                                        title="Remove from history"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="3 6 5 6 21 6"></polyline>
                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                        </svg>
                                    </button>
                                    {editingId === schedule.task_id ? (
                                        <input
                                            type="text"
                                            className="inline-title-input"
                                            value={editTitle}
                                            onChange={(e) => setEditTitle(e.target.value)}
                                            onBlur={() => renameSchedule(schedule.task_id, editTitle)}
                                            onKeyDown={(e) => handleKeyDown(e, schedule.task_id)}
                                            autoFocus
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    ) : (
                                        <h3
                                            onClick={() => startEditing(schedule)}
                                            className="editable-title"
                                            title="Click to rename"
                                        >
                                            {schedule.title || "Matrix Schedule"}
                                            <span className="edit-icon">✎</span>
                                        </h3>
                                    )}
                                    <p>Status: <span className={`status-badge ${schedule.status.toLowerCase()}`}>{schedule.status}</span></p>
                                    <p className="timestamp">Submitted: {new Date(schedule.date_created).toLocaleString()}</p>
                                    {schedule.status === "Completed" && schedule.solution && (
                                        <button className="view-btn" onClick={() => setSelectedSchedule(schedule)}>
                                            View Solution
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    }
                </>
            )}
        </div>
    );
}