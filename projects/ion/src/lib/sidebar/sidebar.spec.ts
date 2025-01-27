import { CommonModule } from '@angular/common';
import { render, screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { IonButtonModule } from '../button/button.module';
import { IonSidebarProps } from '../core/types/sidebar';
import { IonIconModule } from '../icon/icon.module';
import { IonSidebarGroupComponent } from './sidebar-group/sidebar-group.component';
import { IonSidebarItemComponent } from './sidebar-item/sidebar-item.component';
import { IonSidebarComponent } from './sidebar.component';

const components = {
  sidebar: 'ion-sidebar',
  group: 'sidebar-group',
  toggleVisibility: 'ion-sidebar__toggle-visibility',
  outsideContainer: 'ion-sidebar__outside-container',
};

const getByTestId = (key: keyof typeof components): HTMLElement => {
  return screen.getByTestId(components[key]);
};

const logo: IonSidebarProps['logo'] = 'logo.svg';

const closeOnSelectConfig: IonSidebarProps['closeOnSelect'] = true;

const actionMock = jest.fn();

const items: IonSidebarProps['items'] = [
  {
    title: 'Item 1',
    icon: 'user',
    action: actionMock,
  },
  {
    title: 'Item 2',
    icon: 'pencil',
    action: actionMock,
  },
  {
    title: 'Group 1',
    icon: 'star-solid',
    action: actionMock,
    options: [
      {
        title: 'Item group 1',
        icon: 'box',
        action: actionMock,
      },
      {
        title: 'Item group 2',
        icon: 'working',
        action: actionMock,
      },
    ],
  },
];

const sut = async (
  props: IonSidebarProps = { logo: '', items: [], closeOnSelect: false }
): Promise<void> => {
  await render(IonSidebarComponent, {
    componentProperties: { ...props },
    declarations: [IonSidebarItemComponent, IonSidebarGroupComponent],
    imports: [CommonModule, IonIconModule, IonButtonModule],
  });
};

describe('Sidebar', () => {
  describe('Not visible', () => {
    beforeEach(async () => {
      await sut({ items, logo });
    });
    it('should not show sidebar by default', () => {
      expect(getByTestId('sidebar')).not.toHaveClass('ion-sidebar--opened');
    });
    it('should show sidebar after clicking on toggle visibility button', () => {
      userEvent.click(getByTestId('toggleVisibility').firstElementChild);
      expect(getByTestId('sidebar')).toHaveClass('ion-sidebar--opened');
    });
  });
  describe('Visible', () => {
    beforeEach(async () => {
      await sut({ items, logo, logoAction: actionMock });
      userEvent.click(getByTestId('toggleVisibility').firstElementChild);
    });

    afterEach(async () => {
      jest.clearAllMocks();
    });

    it('should render sidebar', () => {
      expect(getByTestId('sidebar')).toBeInTheDocument();
    });
    it('should render logo on sidebar', () => {
      expect(screen.getByRole('img')).toHaveAttribute('src', logo);
    });
    it('shoud call sidebar logo action', () => {
      userEvent.click(screen.getByRole('img'));
      expect(actionMock).toHaveBeenCalledTimes(1);
    });
    it('should render toggle sidebar visibility button', () => {
      const toggleVisibilityBtn = screen.queryAllByTestId(
        'ion-sidebar__toggle-visibility'
      );
      expect(getByTestId('sidebar')).toContainElement(toggleVisibilityBtn[0]);
    });
    describe.each(
      items
        .map((item, index) => {
          return { ...item, index };
        })
        .filter((item) => !item.options || !item.options.length)
    )('item $title', ({ title, icon, index }) => {
      const defaultItemTestId = `ion-sidebar__item-${index}`;
      it(`should render item ${title}`, () => {
        expect(screen.getByTestId(defaultItemTestId)).toHaveTextContent(title);
      });
      it(`should render icon ${icon}`, () => {
        const itemIcon = document.getElementById(`ion-icon-${icon}`);
        expect(screen.getByTestId(defaultItemTestId)).toContainElement(
          itemIcon
        );
      });
    });
    describe.each(
      items
        .map((item, index) => {
          return { ...item, index };
        })
        .filter((item) => item.options && item.options.length)
    )('group $title', ({ title, icon, index, options }) => {
      const defaultGroupTestId = `ion-sidebar__group-${index}`;
      it(`should render group with ${title}`, () => {
        expect(screen.getByTestId(defaultGroupTestId)).toHaveTextContent(title);
      });
      it(`should render group with icon ${icon}`, () => {
        const itemIcon = document.getElementById(`ion-icon-${icon}`);
        expect(screen.getByTestId(defaultGroupTestId)).toContainElement(
          itemIcon
        );
      });
      it.each(options)(
        '$title should be visible after clicking on group',
        ({ title: itemTitle }) => {
          userEvent.click(screen.getByTestId('sidebar-group__toggle-icon'));
          expect(screen.getByText(itemTitle)).toBeVisible();
        }
      );
    });
    describe('clicking on items', () => {
      const selectedItemClass = 'ion-sidebar-item--selected';
      const selectedGroupClass = 'sidebar-group--selected';
      let item1: HTMLElement;
      let item2: HTMLElement;
      let groupName: HTMLElement;
      let itemGroup2: HTMLElement;
      beforeEach(() => {
        item1 = screen.getByRole('button', {
          name: items[0].title,
        });
        item2 = screen.getByRole('button', {
          name: items[1].title,
        });
        groupName = screen.getByText('Group 1');
        userEvent.click(screen.getByTestId('sidebar-group__toggle-icon'));
        itemGroup2 = screen.getByRole('button', {
          name: items[2].options[1].title,
        });
      });
      afterEach(() => {
        actionMock.mockClear();
      });
      it('should render an item selected when click on an item', () => {
        userEvent.click(item1);
        expect(item1).toHaveClass(selectedItemClass);
      });
      it('should render only one item selected at a time', () => {
        userEvent.click(item1);
        userEvent.click(item2);
        expect(item1).not.toHaveClass(selectedItemClass);
        expect(item2).toHaveClass(selectedItemClass);
      });
      it('should render a group selected when click on an item inside a group', () => {
        userEvent.click(itemGroup2);
        expect(itemGroup2).toHaveClass(selectedItemClass);
        expect(getByTestId('group')).toHaveClass(selectedGroupClass);
      });
      it('should render only group or item selected at a time', () => {
        userEvent.click(item1);
        userEvent.click(itemGroup2);
        expect(item1).not.toHaveClass(selectedItemClass);
        expect(itemGroup2).toHaveClass(selectedItemClass);
        expect(getByTestId('group')).toHaveClass(selectedGroupClass);
      });
      it('should render item selected and group not selected', () => {
        userEvent.click(itemGroup2);
        userEvent.click(item1);
        expect(item1).toHaveClass(selectedItemClass);
        expect(itemGroup2).not.toHaveClass(selectedItemClass);
        expect(getByTestId('group')).not.toHaveClass(selectedGroupClass);
      });
      it('should call action function when click on an item', () => {
        userEvent.click(item1);
        expect(actionMock).toHaveBeenCalledTimes(1);
      });
      it('should call action function when click on an item inside a group', () => {
        userEvent.click(itemGroup2);
        expect(actionMock).toHaveBeenCalledTimes(1);
      });
      it('should call action function when click on a group title', () => {
        userEvent.click(groupName);
        expect(actionMock).toHaveBeenCalledTimes(1);
      });
    });
  });
  describe('Clicking outside it', () => {
    it('should close sidebar after clicking outside it', async () => {
      jest.useFakeTimers();
      const timeDelay = 300;

      await render(IonSidebarComponent, {
        declarations: [IonSidebarItemComponent, IonSidebarGroupComponent],
        imports: [CommonModule, IonIconModule, IonButtonModule],
      });

      userEvent.click(getByTestId('toggleVisibility').firstElementChild);
      jest.advanceTimersByTime(timeDelay);
      expect(getByTestId('sidebar')).toHaveClass('ion-sidebar--opened');
      userEvent.click(
        within(getByTestId('outsideContainer')).getByTestId(
          'ion-sidebar__toggle-visibility'
        )
      );

      expect(getByTestId('sidebar')).not.toHaveClass('ion-sidebar--opened');
    });
  });
  describe('Group without action', () => {
    beforeEach(async () => {
      items[2].action = undefined;
      await sut({ items: [...items], logo });
      userEvent.click(getByTestId('toggleVisibility').firstElementChild);
    });
    describe.each(
      items
        .map((item, index) => {
          return { ...item, index };
        })
        .filter((item) => item.options && item.options.length)
    )('group $title', ({ title, icon, index, options }) => {
      const defaultGroupTestId = `ion-sidebar__group-${index}`;
      it(`should render group with ${title}`, () => {
        expect(screen.getByTestId(defaultGroupTestId)).toHaveTextContent(title);
      });
      it(`should render group with icon ${icon}`, () => {
        const itemIcon = document.getElementById(`ion-icon-${icon}`);
        expect(screen.getByTestId(defaultGroupTestId)).toContainElement(
          itemIcon
        );
      });
      it.each(options)(
        '$title should be visible after clicking on group',
        ({ title: itemTitle }) => {
          userEvent.click(screen.getByTestId('sidebar-group__header'));
          expect(screen.getByText(itemTitle)).toBeVisible();
        }
      );
    });
    it('should not call an action when clicking on group title', () => {
      userEvent.click(screen.getByText('Group 1'));
      expect(actionMock).not.toHaveBeenCalled();
    });
  });
  describe('Close on select config', () => {
    const selectedItemClass = 'ion-sidebar-item--selected';
    let item1: HTMLElement;
    let itemGroup2: HTMLElement;
    beforeEach(async () => {
      await sut({ items: items, logo, closeOnSelect: closeOnSelectConfig });
      userEvent.click(getByTestId('toggleVisibility').firstElementChild);
      expect(getByTestId('sidebar')).toHaveClass('ion-sidebar--opened');
    });
    it('should close sidebar when option is clicked', async () => {
      item1 = screen.getByRole('button', {
        name: items[0].title,
      });

      userEvent.click(item1);
      expect(item1).toHaveClass(selectedItemClass);
      expect(getByTestId('sidebar')).not.toHaveClass('ion-sidebar--opened');
    });
    it('should close sidebar when options is clicked', async () => {
      userEvent.click(screen.getByTestId('sidebar-group__toggle-icon'));

      itemGroup2 = screen.getByRole('button', {
        name: items[2].options[1].title,
      });

      userEvent.click(itemGroup2);
      expect(itemGroup2).toHaveClass(selectedItemClass);
      expect(getByTestId('sidebar')).not.toHaveClass('ion-sidebar--opened');
    });
    it('should close sidebar when logo is clicked', async () => {
      userEvent.click(screen.getByRole('img'));
      expect(getByTestId('sidebar')).not.toHaveClass('ion-sidebar--opened');
    });
  });
});
