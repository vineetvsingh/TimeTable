import { useCallback, useEffect, useState } from 'react';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  getDocs,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';

const toDate = (value) => (value?.toDate ? value.toDate() : new Date(value || 0));

/**
 * The signed-in user's timetables in Firestore.
 * `status` is 'loading' | 'ready' | 'error'.
 */
export const useSavedTimetables = (user) => {
  const [timetables, setTimetables] = useState([]);
  const [status, setStatus] = useState('loading');
  const uid = user.uid;

  const refresh = useCallback(async () => {
    setStatus('loading');
    try {
      const snapshot = await getDocs(query(collection(db, 'timetables'), where('userId', '==', uid)));
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      // Sorted here rather than in the query to avoid needing a Firestore index.
      list.sort((a, b) => toDate(b.createdAt) - toDate(a.createdAt));
      setTimetables(list);
      setStatus('ready');
    } catch (error) {
      console.error('Error fetching timetables:', error);
      setStatus('error');
    }
  }, [uid]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /** Saves new content, or updates `id` if given. Returns the document id. */
  const save = async (content, id) => {
    const data = { ...content, updatedAt: serverTimestamp() };
    if (id) {
      try {
        await updateDoc(doc(db, 'timetables', id), data);
        return id;
      } catch (error) {
        // The saved copy was deleted elsewhere: save it as a new one below.
        if (error.code !== 'not-found') throw error;
      }
    }
    const ref = await addDoc(collection(db, 'timetables'), {
      ...data,
      userId: user.uid,
      userEmail: user.email,
      createdAt: serverTimestamp()
    });
    return ref.id;
  };

  const remove = async (id) => {
    await deleteDoc(doc(db, 'timetables', id));
    setTimetables(prev => prev.filter(t => t.id !== id));
  };

  return { timetables, status, refresh, save, remove };
};
