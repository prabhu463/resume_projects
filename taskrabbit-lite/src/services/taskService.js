/**
 * Task Service for TaskRabbit Lite
 * Real-time database listeners to update task status instantly
 */
import firestore from '@react-native-firebase/firestore';

const tasksCollection = firestore().collection('tasks');
const bidsCollection = firestore().collection('bids');

export const taskService = {
  /**
   * Create a new task request
   */
  async createTask(taskData, userId) {
    const task = {
      ...taskData,
      customerId: userId,
      providerId: null,
      status: 'open', // open, assigned, in_progress, completed, cancelled
      bidsCount: 0,
      createdAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await tasksCollection.add(task);
    return { id: docRef.id, ...task };
  },

  /**
   * Get all tasks with real-time updates
   * @param {Function} onSnapshot - Callback for real-time updates
   * @param {Object} filters - Filter options
   */
  subscribeToTasks(onSnapshot, filters = {}) {
    let query = tasksCollection.orderBy('createdAt', 'desc');

    if (filters.status) {
      query = query.where('status', '==', filters.status);
    }

    if (filters.category) {
      query = query.where('category', '==', filters.category);
    }

    if (filters.customerId) {
      query = query.where('customerId', '==', filters.customerId);
    }

    if (filters.providerId) {
      query = query.where('providerId', '==', filters.providerId);
    }

    // Real-time listener for instant updates
    return query.onSnapshot(
      (snapshot) => {
        const tasks = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        onSnapshot(tasks);
      },
      (error) => {
        console.error('Tasks subscription error:', error);
      }
    );
  },

  /**
   * Subscribe to a single task for real-time status updates
   */
  subscribeToTask(taskId, onSnapshot) {
    return tasksCollection.doc(taskId).onSnapshot(
      (doc) => {
        if (doc.exists) {
          onSnapshot({ id: doc.id, ...doc.data() });
        }
      },
      (error) => {
        console.error('Task subscription error:', error);
      }
    );
  },

  /**
   * Update task status with real-time sync
   */
  async updateTaskStatus(taskId, status, additionalData = {}) {
    await tasksCollection.doc(taskId).update({
      status,
      ...additionalData,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });
  },

  /**
   * Assign provider to task
   */
  async assignProvider(taskId, providerId) {
    await tasksCollection.doc(taskId).update({
      providerId,
      status: 'assigned',
      assignedAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });
  },

  /**
   * Submit a bid for a task
   */
  async submitBid(taskId, providerId, bidData) {
    const batch = firestore().batch();

    // Create bid document
    const bidRef = bidsCollection.doc();
    batch.set(bidRef, {
      taskId,
      providerId,
      amount: bidData.amount,
      message: bidData.message || '',
      estimatedTime: bidData.estimatedTime,
      status: 'pending', // pending, accepted, rejected
      createdAt: firestore.FieldValue.serverTimestamp(),
    });

    // Increment bids count on task
    const taskRef = tasksCollection.doc(taskId);
    batch.update(taskRef, {
      bidsCount: firestore.FieldValue.increment(1),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });

    await batch.commit();
    return bidRef.id;
  },

  /**
   * Subscribe to bids for a task
   */
  subscribeToBids(taskId, onSnapshot) {
    return bidsCollection
      .where('taskId', '==', taskId)
      .orderBy('createdAt', 'desc')
      .onSnapshot(
        (snapshot) => {
          const bids = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          onSnapshot(bids);
        },
        (error) => {
          console.error('Bids subscription error:', error);
        }
      );
  },

  /**
   * Accept a bid and assign provider
   */
  async acceptBid(bidId, taskId) {
    const batch = firestore().batch();

    // Get bid details
    const bidDoc = await bidsCollection.doc(bidId).get();
    const bidData = bidDoc.data();

    // Update bid status
    batch.update(bidsCollection.doc(bidId), {
      status: 'accepted',
    });

    // Reject other bids
    const otherBids = await bidsCollection
      .where('taskId', '==', taskId)
      .where('status', '==', 'pending')
      .get();

    otherBids.docs.forEach((doc) => {
      if (doc.id !== bidId) {
        batch.update(doc.ref, { status: 'rejected' });
      }
    });

    // Assign provider to task
    batch.update(tasksCollection.doc(taskId), {
      providerId: bidData.providerId,
      acceptedBidId: bidId,
      agreedPrice: bidData.amount,
      status: 'assigned',
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });

    await batch.commit();
  },

  /**
   * Mark task as completed
   */
  async completeTask(taskId) {
    await this.updateTaskStatus(taskId, 'completed', {
      completedAt: firestore.FieldValue.serverTimestamp(),
    });
  },
};

export default taskService;
