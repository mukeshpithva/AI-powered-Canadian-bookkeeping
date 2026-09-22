import { Component, type ReactNode } from 'react';

type ReceiptsPageProps = {
  children: ReactNode;
};

export default class ReceiptsPage extends Component<ReceiptsPageProps> {
  render() {
    return <section className="page receipts-page">{this.props.children}</section>;
  }
}
