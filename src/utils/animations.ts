// Common animation variants for reuse across components

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 }
};

export const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export const fadeInDown = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0 }
};

export const fadeInLeft = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 }
};

export const fadeInRight = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0 }
};

export const staggerChildren = {
  visible: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export const scaleUp = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1 }
};

export const buttonHover = {
  hover: { 
    scale: 1.05,
    boxShadow: '0 0 15px rgba(139, 92, 246, 0.7)'
  },
  tap: { 
    scale: 0.95 
  }
};

export const glowingBorder = {
  initial: { 
    boxShadow: '0 0 0 rgba(139, 92, 246, 0)' 
  },
  animate: { 
    boxShadow: ['0 0 5px rgba(139, 92, 246, 0.5)', '0 0 20px rgba(139, 92, 246, 0.7)', '0 0 5px rgba(139, 92, 246, 0.5)'],
    transition: { 
      duration: 2,
      repeat: Infinity,
      repeatType: 'reverse' 
    }
  }
};

export const float = {
  initial: { y: 0 },
  animate: {
    y: [0, -10, 0],
    transition: {
      duration: 4,
      repeat: Infinity,
      repeatType: 'reverse',
      ease: 'easeInOut'
    }
  }
}; 