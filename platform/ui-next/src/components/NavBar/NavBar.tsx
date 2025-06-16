import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

const stickyClasses = 'sticky top-0';
const notStickyClasses = 'relative';

const NavBar = ({
  className,
  children,
  isSticky,
  isInDicomViewer = false,
}: {
  className?: string;
  children?: React.ReactNode;
  isSticky?: boolean;
  isInDicomViewer?: boolean;
}) => {
  return (
    <div
      className={classnames(
        'z-20 border-[#E2E8F0] px-1',
        isInDicomViewer ? '' : 'bg-[#004D45]',
        isSticky && stickyClasses,
        !isSticky && notStickyClasses,
        className
      )}
      style={
        isInDicomViewer
          ? {
              background: 'rgba(20,20,20,0.82)',
              WebkitBackdropFilter: 'blur(12px)',
              backdropFilter: 'blur(12px)',
              borderBottom: '1.5px solid rgba(80,80,80,0.25)',
              boxShadow: '0 2px 12px 0 rgba(0,0,0,0.18)',
            }
          : undefined
      }
    >
      {children}
    </div>
  );
};

NavBar.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
  isSticky: PropTypes.bool,
  isInDicomViewer: PropTypes.bool,
};

export default NavBar;
