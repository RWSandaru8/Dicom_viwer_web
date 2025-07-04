import React from 'react';
import {
  ToolButtonList,
  ToolButton,
  ToolButtonListDefault,
  ToolButtonListDropDown,
  ToolButtonListItem,
  ToolButtonListDivider,
} from '@ohif/ui-next';
import { useToolbar } from '@ohif/core/src';

interface ToolButtonListWrapperProps {
  buttonSection: string;
  onInteraction?: (details: { itemId: string; commands?: Record<string, unknown> }) => void;
  id: string;
  horizontalInHeader?: boolean;
  sidebarTriggerOnly?: boolean;
  onSidebarTrigger?: () => void;
  isActive?: boolean;
}

/**
 * Wraps the ToolButtonList component to handle the OHIF toolbar button structure
 * @param props - Component props
 * @returns Component
 * // test
 */
export default function ToolButtonListWrapper({
  buttonSection,
  id,
  horizontalInHeader = false,
  sidebarTriggerOnly = false,
  onSidebarTrigger,
  isActive = false,
  showLabelBelowIcon = false,
}: ToolButtonListWrapperProps) {
  const { onInteraction, toolbarButtons } = useToolbar({
    buttonSection,
  });

  if (!toolbarButtons?.length) {
    return null;
  }

  const primary =
    toolbarButtons.find(button => button.componentProps.isActive)?.componentProps ||
    toolbarButtons[0].componentProps;

  const items = toolbarButtons.map(button => button.componentProps);

  if (sidebarTriggerOnly) {
    return (
      <ToolButton
        key={primary.id}
        {...primary}
        isActive={isActive}
        onInteraction={() => onSidebarTrigger?.()}
        className={`${primary.className} text-white`}
        showLabelBelowIcon={true}
      />
    );
  }

  if (horizontalInHeader) {
    return (
      <div className="flex flex-row items-center gap-2">
        {items.map(item => (
          <ToolButton
            key={item.id}
            {...item}
            onInteraction={({ itemId }) => onInteraction?.({ id, itemId, commands: item.commands })}
            className={`${item.className} text-white hover:text-blue-200`}
          />
        ))}
      </div>
    );
  }

  return (
    <ToolButtonList>
      <ToolButtonListDefault>
        <div
          data-cy={`${id}-split-button-primary`}
          data-tool={primary.id}
          data-active={primary.isActive}
        >
          <ToolButton
            {...primary}
            onInteraction={({ itemId }) =>
              onInteraction?.({ id, itemId, commands: primary.commands })
            }
            className={`${primary.className} text-white`}
          />
        </div>
      </ToolButtonListDefault>
      <ToolButtonListDivider className={primary.isActive ? 'opacity-0' : 'opacity-100'} />
      <div data-cy={`${id}-split-button-secondary`}>
        <ToolButtonListDropDown>
          {items.map(item => {
            return (
              <ToolButtonListItem
                key={item.id}
                {...item}
                data-cy={item.id}
                data-tool={item.id}
                data-active={item.isActive}
                onSelect={() => onInteraction?.({ id, itemId: item.id, commands: item.commands })}
                className="text-white hover:bg-blue-600"
              >
                <span className="pl-1">{item.label || item.tooltip || item.id}</span>
              </ToolButtonListItem>
            );
          })}
        </ToolButtonListDropDown>
      </div>
    </ToolButtonList>
  );
}
