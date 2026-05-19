import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const MotionDiv = motion.div;

const Modal = ({ isOpen, onClose, title, children }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="modal-overlay">
        <MotionDiv
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 30 }}
          className="modal-content glass"
        >
          <div className="modal-header">
            <h3>{title}</h3>
            <button onClick={onClose} className="btn-icon"><X size={20}/></button>
          </div>
          <div className="modal-body">{children}</div>
        </MotionDiv>
      </div>
    )}
  </AnimatePresence>
);

export default Modal;
