import React from 'react';
import { motion } from 'framer-motion';

const MissionCompleteSticker = () => (
    <motion.div
        initial={{ scale: 2, opacity: 0, rotate: -45 }}
        animate={{ scale: 1, opacity: 1, rotate: -12 }}
        transition={{ type: 'spring', damping: 12, stiffness: 200 }}
        className="pointer-events-none z-20 flex-shrink-0"
    >
        <div className="relative flex items-center justify-center opacity-90">
            {/* Outer Clay Circle */}
            <div className="w-24 h-24 bg-[#8ecb84]/10 border-4 border-[#8ecb84]/40 rounded-full flex items-center justify-center p-1 border-dashed shadow-[inset_0_-4px_8px_rgba(0,0,0,0.1)]">
                <div className="w-full h-full bg-[#8ecb84]/20 border-2 border-[#2d5a27]/30 rounded-full flex items-center justify-center shadow-inner">
                    <div className="bg-[#2d5a27] px-4 py-2 transform rotate-2 rounded-lg shadow-[inset_0_-2px_4px_rgba(0,0,0,0.3),0_4px_8px_rgba(0,0,0,0.2)]">
                        <div className="flex flex-col items-center">
                            <span className="text-[8px] font-black text-[#8ecb84] uppercase tracking-tighter leading-none mb-0.5">MISSION</span>
                            <div className="h-[1.5px] w-full bg-[#8ecb84]/40 mb-0.5"></div>
                            <span className="text-[13px] font-black text-white uppercase leading-none tracking-tight">COMPLETE</span>
                            <div className="h-[1.5px] w-full bg-[#8ecb84]/40 mt-0.5"></div>
                            <div className="flex gap-0.5 mt-0.5">
                                {[1,2,3].map(i => <span key={i} className="text-[8px] text-[#8ecb84]">★</span>)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </motion.div>
);

export default MissionCompleteSticker;
