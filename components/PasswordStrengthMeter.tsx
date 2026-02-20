import React from 'react';

interface Props {
    password: string;
}

export const PasswordStrengthMeter: React.FC<Props> = ({ password }) => {
    const calculateStrength = (pass: string) => {
        let score = 0;
        if (!pass) return { score: 0, label: '', color: 'bg-fiverr-border', textColor: 'text-fiverr-text-muted' };

        if (pass.length >= 6) score += 1;
        if (pass.match(/[a-zA-Z]/) && pass.match(/\d/)) score += 1;
        if (pass.length >= 8 && pass.match(/[A-Z]/)) score += 1;
        if (pass.match(/[^a-zA-Z\d]/)) score += 1;

        if (score <= 1) return { score, label: 'Ненадежный', color: 'bg-fiverr-red', textColor: 'text-fiverr-red' };
        if (score === 2) return { score, label: 'Средний', color: 'bg-fiverr-yellow', textColor: 'text-fiverr-yellow' };
        if (score >= 3) return { score, label: 'Надежный', color: 'bg-fiverr-green', textColor: 'text-fiverr-green' };

        return { score: 0, label: '', color: 'bg-fiverr-border', textColor: 'text-fiverr-text-muted' };
    };

    const { score, label, color, textColor } = calculateStrength(password);

    if (!password) return null;

    return (
        <div className="mt-2">
            <div className="flex gap-1.5 mb-1.5">
                {[1, 2, 3, 4].map((i) => (
                    <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors ${i <= score ? color : 'bg-fiverr-border'
                            }`}
                    />
                ))}
            </div>
            <div className={`text-xs font-medium ${textColor}`}>
                {label}
            </div>
        </div>
    );
};
