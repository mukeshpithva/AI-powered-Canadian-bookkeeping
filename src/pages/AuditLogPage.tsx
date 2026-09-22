import { Component, type ReactNode } from 'react';

type AuditLogPageProps = {
  children: ReactNode;
};

export default class AuditLogPage extends Component<AuditLogPageProps> {
  render() {
    return <section className="page audit-page">{this.props.children}</section>;
  }
}
