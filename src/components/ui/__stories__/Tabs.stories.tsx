import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { Tabs, TabList, Tab, TabPanel } from '../Tabs';

const meta = {
    title: 'Design System/Navigation/Tabs',
    component: Tabs,
    tags: ['autodocs'],
    args: {
        value: 'overview',
        onChange: () => {},
        children: null,
    },
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    render: function DefaultTabs() {
        const [tab, setTab] = useState('overview');
        return (
            <Tabs value={tab} onChange={setTab}>
                <TabList>
                    <Tab value="overview">Overview</Tab>
                    <Tab value="analytics">Analytics</Tab>
                    <Tab value="settings">Settings</Tab>
                </TabList>
                <TabPanel value="overview">
                    <div style={{ padding: 16 }}>Overview content</div>
                </TabPanel>
                <TabPanel value="analytics">
                    <div style={{ padding: 16 }}>Analytics dashboard</div>
                </TabPanel>
                <TabPanel value="settings">
                    <div style={{ padding: 16 }}>Settings panel</div>
                </TabPanel>
            </Tabs>
        );
    },
};

export const WithDisabledTab: Story = {
    render: function DisabledTabs() {
        const [tab, setTab] = useState('active');
        return (
            <Tabs value={tab} onChange={setTab}>
                <TabList>
                    <Tab value="active">Active</Tab>
                    <Tab value="drafts">Drafts</Tab>
                    <Tab value="archived" disabled>Archived</Tab>
                </TabList>
                <TabPanel value="active"><div style={{ padding: 16 }}>Active demos</div></TabPanel>
                <TabPanel value="drafts"><div style={{ padding: 16 }}>Draft demos</div></TabPanel>
            </Tabs>
        );
    },
};
