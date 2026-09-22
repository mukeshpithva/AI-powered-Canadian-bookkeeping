import { Component, type ReactNode } from 'react';

type SettingsPageProps = {
  children: ReactNode;
};

export default class SettingsPage extends Component<SettingsPageProps> {
  render() {
    return <section className="page settings-page">{this.props.children}</section>;
  }
}
