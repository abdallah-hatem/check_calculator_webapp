"use client";

import { useState, useCallback, useEffect } from "react";
import { apiClient } from "@/lib/api-client";

export interface Friend {
    id: string;
    name: string;
}

export function useFriends() {
    const [friends, setFriends] = useState<Friend[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchFriends = useCallback(async () => {
        setLoading(true);
        try {
            const data = await apiClient.get<Friend[]>("/friends");
            setFriends(data);
        } catch (error) {
            console.error("Failed to fetch friends", error);
        } finally {
            setLoading(false);
        }
    }, []);

    const addFriend = async (name: string) => {
        const friend = await apiClient.post<Friend>("/friends", { name });
        setFriends((prev) => [...prev, friend]);
        return friend;
    };

    const deleteFriend = async (id: string) => {
        await apiClient.delete(`/friends/${id}`);
        setFriends((prev) => prev.filter((f) => f.id !== id));
    };

    useEffect(() => {
        fetchFriends();
    }, [fetchFriends]);

    return { friends, loading, addFriend, deleteFriend, refreshFriends: fetchFriends };
}

export function useReceipts() {
    const [receipts, setReceipts] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchReceipts = useCallback(async () => {
        setLoading(true);
        try {
            const data = await apiClient.get<any[]>("/receipts");
            setReceipts(data);
        } catch (error) {
            console.error("Failed to fetch receipts", error);
        } finally {
            setLoading(false);
        }
    }, []);

    const getReceipt = async (id: string) => {
        return apiClient.get<any>(`/receipts/${id}`);
    };

    const createReceipt = async (data: any) => {
        return apiClient.post<any>("/receipts", data);
    };

    const scanReceipt = async (base64Image: string, mimeType: string) => {
        return apiClient.post<any>("/receipts/scan", { image: base64Image, mimeType });
    };

    return { receipts, loading, fetchReceipts, getReceipt, createReceipt, scanReceipt };
}
