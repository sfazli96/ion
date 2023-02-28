import { CommonModule } from '@angular/common';
import { render, screen } from '@testing-library/angular';
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
};

const getByTestId = (key: keyof typeof components): HTMLElement => {
  return screen.getByTestId(components[key]);
};

const logo: IonSidebarProps['logo'] = 'logo.svg';

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
  props: IonSidebarProps = { logo: '', items: [] }
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
      await sut({ items, logo });
      userEvent.click(getByTestId('toggleVisibility').firstElementChild);
    });
    it('should render sidebar', () => {
      expect(getByTestId('sidebar')).toBeInTheDocument();
    });
    it('should render logo on sidebar', () => {
      expect(screen.getByRole('img')).toHaveAttribute('src', logo);
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
          userEvent.click(screen.getByTestId('sidebar-group__header'));
          expect(screen.getByText(itemTitle)).toBeVisible();
        }
      );
    });
    describe('clicking on items', () => {
      const selectedItemClass = 'ion-sidebar-item--selected';
      const selectedGroupClass = 'sidebar-group--selected';
      let item1: HTMLElement;
      let item2: HTMLElement;
      let itemGroup2: HTMLElement;
      beforeEach(() => {
        item1 = screen.getByRole('button', {
          name: items[0].title,
        });
        item2 = screen.getByRole('button', {
          name: items[1].title,
        });
        userEvent.click(screen.getByTestId('sidebar-group__header'));
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
    });
  });
});