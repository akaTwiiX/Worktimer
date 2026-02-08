export const Colors: ThemeColors[] = [
    { id: 0, value: '#f7d186', label: '9-17', isActive: true },
    { id: 1, value: '#95d0f0', label: 'BLUE', isActive: false },
    { id: 2, value: '#b9e0ab', label: 'Frei', isActive: true },
    { id: 3, value: '#a09fe3', label: '11-19', isActive: true },
    { id: 4, value: '#f79a86', label: 'RED', isActive: false },
    { id: 5, value: '#ffccbb', label: '10-15', isActive: true }
]

export type ThemeColors = {
    id: number;
    value: string;
    label: string;
    isActive: boolean;
}
