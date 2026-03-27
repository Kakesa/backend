import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiGetUnreadCount } from "@/services/api/messages.api";
import { apiGetAssignmentsByStudent, apiGetPendingSubmissions } from "@/services/api/assignments.api";
import { apiGetGradesByStudent } from "@/services/api/grades.api";
import { apiGetMyFees, apiGetMyChildrenFees } from "@/services/api/fees.api";

export interface NavigationBadges {
    messages: number;
    assignments: number;
    grades: number;
    fees: number;
    corrections: number;
}

export function useNavigationBadges() {
    const { user } = useAuth();
    const [badges, setBadges] = useState<NavigationBadges>({
        messages: 0,
        assignments: 0,
        grades: 0,
        fees: 0,
        corrections: 0,
    });

    const fetchBadges = useCallback(async () => {
        if (!user) return;

        try {
            const newBadges: NavigationBadges = {
                messages: 0,
                assignments: 0,
                grades: 0,
                fees: 0,
                corrections: 0,
            };

            // 1. Messages (All roles)
            try {
                newBadges.messages = await apiGetUnreadCount(user.id);
            } catch (e) { console.error("Badges: messaging error", e); }

            // 2. Role specific badges
            if (user.role === "student" && user.linkedId) {
                // Assignments & Grades
                try {
                    const studentProfile = (user as any).linkedProfile;
                    const classId = studentProfile?.class?._id || studentProfile?.classId;

                    if (classId) {
                        const assignments = await apiGetAssignmentsByStudent(user.linkedId, classId);
                        // Count assignments with no student submission
                        // Note: This is an approximation as we don't have a bulk API for submissions status here
                        // but we can check the status if assignment.submissions exists in the response
                        newBadges.assignments = assignments.filter(a =>
                            !a.submissions?.some(s => s.studentId === user.linkedId || (typeof s.studentId === 'object' && (s.studentId as any)._id === user.linkedId))
                        ).length;
                    }

                    const grades = await apiGetGradesByStudent(user.linkedId);
                    // Count grades created in the last 7 days
                    const sevenDaysAgo = new Date();
                    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                    newBadges.grades = grades.filter(g => new Date(g.createdAt || "") > sevenDaysAgo).length;

                    const fees = await apiGetMyFees();
                    newBadges.fees = fees.filter(f => f.balance > 0).length;
                } catch (e) { console.error("Badges: student error", e); }

            } else if (user.role === "teacher" && user.linkedId) {
                try {
                    const pending = await apiGetPendingSubmissions(user.linkedId);
                    newBadges.corrections = pending.length;
                } catch (e) { console.error("Badges: teacher error", e); }

            } else if (user.role === "parent") {
                try {
                    const childrenFees = await apiGetMyChildrenFees();
                    // Count distinct children with unpaid fees
                    newBadges.fees = childrenFees.flat().filter(f => f.balance > 0).length;
                } catch (e) { console.error("Badges: parent error", e); }
            }

            setBadges(newBadges);
        } catch (error) {
            console.error("Erreur lors de la récupération des badges:", error);
        }
    }, [user]);

    useEffect(() => {
        fetchBadges();
        const interval = setInterval(fetchBadges, 60000); // Check every minute
        return () => clearInterval(interval);
    }, [fetchBadges]);

    return { badges, refreshBadges: fetchBadges };
}
