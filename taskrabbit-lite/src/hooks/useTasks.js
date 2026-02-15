/**
 * useTasks Hook for TaskRabbit Lite
 * Real-time task updates using Firebase listeners
 */
import { useState, useEffect } from 'react';
import taskService from '../services/taskService';
import { useAuth } from '../context/AuthContext';

/**
 * Hook for subscribing to tasks with real-time updates
 */
export function useTasks(filters = {}) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    
    // Subscribe to real-time task updates
    const unsubscribe = taskService.subscribeToTasks(
      (updatedTasks) => {
        setTasks(updatedTasks);
        setLoading(false);
      },
      filters
    );

    return () => unsubscribe();
  }, [JSON.stringify(filters)]);

  return { tasks, loading, error };
}

/**
 * Hook for subscribing to a single task with real-time updates
 */
export function useTask(taskId) {
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!taskId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    
    // Subscribe to real-time task updates
    const unsubscribe = taskService.subscribeToTask(
      taskId,
      (updatedTask) => {
        setTask(updatedTask);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [taskId]);

  return { task, loading, error };
}

/**
 * Hook for customer's tasks
 */
export function useMyTasks() {
  const { user } = useAuth();
  return useTasks({ customerId: user?.uid });
}

/**
 * Hook for provider's assigned tasks
 */
export function useAssignedTasks() {
  const { user } = useAuth();
  return useTasks({ providerId: user?.uid });
}

/**
 * Hook for task bids with real-time updates
 */
export function useTaskBids(taskId) {
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!taskId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    
    const unsubscribe = taskService.subscribeToBids(
      taskId,
      (updatedBids) => {
        setBids(updatedBids);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [taskId]);

  return { bids, loading };
}

export default useTasks;
