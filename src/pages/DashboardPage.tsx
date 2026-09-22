import { Component, type ReactNode } from 'react';

type DashboardPageProps = {
  children: ReactNode;
};

export default class DashboardPage extends Component<DashboardPageProps> {
  render() {
    return <section className="page dashboard-page">{this.props.children}</section>;
  }
}
