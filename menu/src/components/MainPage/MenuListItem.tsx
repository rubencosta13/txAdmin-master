import React, { memo, useEffect, useRef, useState } from "react";
import {
  ListItem,
  ListItemIcon,
  ListItemSecondaryAction,
  ListItemText,
  Theme,
  Typography,
} from "@mui/material";
import makeStyles from "@mui/styles/makeStyles";
import { useKeyboardNavigation } from "../../hooks/useKeyboardNavigation";
import { Code } from "@mui/icons-material";
import { fetchNui } from "../../utils/fetchNui";
import { useTranslate } from "react-polyglot";
import {
  ResolvablePermission,
  usePermissionsValue,
} from "../../state/permissions.state";
import { userHasPerm } from "../../utils/miscUtils";
import { useSnackbar } from "notistack";

export interface MenuListItemProps {
  title: string;
  label: string;
  requiredPermission?: ResolvablePermission;
  icon: JSX.Element;
  selected: boolean;
  onSelect: () => void;
}

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    borderRadius: 15,
  },
  rootDisabled: {
    borderRadius: 15,
    opacity: 0.3,
  },
  icon: {
    color: theme.palette.text.secondary,
  },
  overrideText: {
    color: theme.palette.text.primary,
    fontSize: 16,
  },
}));
// TODO: Actually do disabled item styling right now it will only remove
// enter from working
export const MenuListItem: React.FC<MenuListItemProps> = memo(
  ({ 
    title,
    label,
    requiredPermission,
    icon,
    selected,
    onSelect,
  }) => {
    const classes = useStyles();
    const t = useTranslate();
    const divRef = useRef<HTMLDivElement | null>(null);
    const userPerms = usePermissionsValue();
    const isUserAllowed = requiredPermission
      ? userHasPerm(requiredPermission, userPerms)
      : true;
    const { enqueueSnackbar } = useSnackbar();

    const handleEnter = (): void => {
      if (!selected) return;

      if (!isUserAllowed) {
        enqueueSnackbar(t("nui_menu.misc.action_unauthorized"), {
          variant: "error",
          anchorOrigin: {
            horizontal: "center",
            vertical: "bottom",
          },
        });
        return;
      }

      fetchNui("playSound", "enter");
      onSelect();
    };

    useEffect(() => {
      if (selected && divRef) {
        divRef.current.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "start",
        });
      }
    }, [selected]);

    useKeyboardNavigation({
      onEnterDown: handleEnter,
      disableOnFocused: true,
    });

    return (
      <div ref={divRef}>
        <ListItem
          onClick={() => onSelect()}
          className={isUserAllowed ? classes.root : classes.rootDisabled}
          dense
          selected={selected}
        >
          <ListItemIcon className={classes.icon}>{icon}</ListItemIcon>
          <ListItemText
            primary={title}
            secondary={label}
            classes={{
              primary: classes.overrideText,
            }}
          />
        </ListItem>
      </div>
    );
  }
);

interface MenuListItemMultiAction {
  name?: string | JSX.Element;
  label: string;
  value: string | number | boolean;
  icon?: JSX.Element;
  onSelect: () => void;
}

export interface MenuListItemMultiProps {
  title: string;
  requiredPermission?: ResolvablePermission;
  initialValue?: MenuListItemMultiAction;
  selected: boolean;
  icon: JSX.Element;
  actions: MenuListItemMultiAction[];
}

export const MenuListItemMulti: React.FC<MenuListItemMultiProps> = memo(
  ({
    selected,
    title,
    actions,
    icon,
    initialValue,
    requiredPermission,
  }) => {
    const classes = useStyles();
    const t = useTranslate();
    const [curState, setCurState] = useState(0);
    const userPerms = usePermissionsValue();
    const { enqueueSnackbar } = useSnackbar();

    const isUserAllowed = requiredPermission
      ? userHasPerm(requiredPermission, userPerms)
      : true;

    const compMounted = useRef(false);

    const divRef = useRef<HTMLDivElement | null>(null);

    const showNotAllowedAlert = () => {
      enqueueSnackbar(t("nui_menu.misc.action_unauthorized"), {
        variant: "error",
        anchorOrigin: {
          horizontal: "center",
          vertical: "bottom",
        },
      });
    };

    useEffect(() => {
      if (selected && divRef) {
        divRef.current.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "start",
        });
      }
    }, [selected]);

    // Mount/unmount detection
    // We will only run this hook after initial mount
    // and not on unmount.
    // NOTE: This hook does not work if actions prop are dynamic
    useEffect(() => {
      if (!compMounted.current) {
        compMounted.current = true;
        // We will set the initial value of the item based on the passed initial value
        const index = actions.findIndex((a) => a.value === initialValue?.value);
        setCurState(index > -1 ? index : 0);
      }
    }, [curState]);

    const handleLeftArrow = () => {
      if (!selected) return;

      fetchNui("playSound", "move").catch();
      const nextEstimatedItem = curState - 1;
      const nextItem =
        nextEstimatedItem < 0 ? actions.length - 1 : nextEstimatedItem;
      setCurState(nextItem);
    };

    const handleRightArrow = () => {
      if (!selected) return;

      fetchNui("playSound", "move");
      const nextEstimatedItem = curState + 1;
      const nextItem =
        nextEstimatedItem >= actions.length ? 0 : nextEstimatedItem;
      setCurState(nextItem);
    };

    const handleEnter = () => {
      if (!selected) return;
      if (!isUserAllowed) return showNotAllowedAlert();

      fetchNui("playSound", "enter").catch();
      actions[curState].onSelect();
    };

    useKeyboardNavigation({
      onRightDown: handleRightArrow,
      onLeftDown: handleLeftArrow,
      onEnterDown: handleEnter,
      disableOnFocused: true,
    });

    return (
      <div ref={divRef}>
        <ListItem
          className={isUserAllowed ? classes.root : classes.rootDisabled}
          dense
          selected={selected}
        >
          <ListItemIcon className={classes.icon}>
            {actions[curState]?.icon ?? icon}
          </ListItemIcon>
          <ListItemText
            primary={
              <>
                {title}:&nbsp;
                <Typography
                  component="span"
                  color="text.secondary"
                >
                  {actions[curState]?.name ?? "???"}
                </Typography>
              </>
            }
            secondary={actions[curState]?.label ?? "???"}
            classes={{
              primary: classes.overrideText,
            }}
          />
          <ListItemSecondaryAction>
            <Code className={classes.icon} />
          </ListItemSecondaryAction>
        </ListItem>
      </div>
    );
  }
);
