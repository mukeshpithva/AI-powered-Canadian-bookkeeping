import { Component, type ReactNode } from 'react';

type CompliancePageProps = {
  children: ReactNode;
};

export default class CompliancePage extends Component<CompliancePageProps> {
  render() {
    return <section className="page compliance-page">{this.props.children}</section>;
  }
}
