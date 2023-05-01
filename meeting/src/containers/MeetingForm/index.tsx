// Copyright 2020-2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import React, { ChangeEvent, useContext, useState } from 'react';
import { useHistory } from 'react-router-dom';
import {
  Checkbox,
  DeviceLabels,
  Flex,
  FormField,
  Heading,
  Input,
  Label,
  Modal,
  ModalBody,
  ModalHeader,
  PrimaryButton,
  Select,
  useMeetingManager,
} from 'amazon-chime-sdk-component-library-react';
import { DefaultBrowserBehavior, MeetingSessionConfiguration } from 'amazon-chime-sdk-js';

import { getErrorContext } from '../../providers/ErrorProvider';
import routes from '../../constants/routes';
import Card from '../../components/Card';
import Spinner from '../../components/icons/Spinner';
import DevicePermissionPrompt from '../DevicePermissionPrompt';
import RegionSelection from './RegionSelection';
import { createGetAttendeeCallback, fetchMeeting } from '../../utils/api';
import { useAppState } from '../../providers/AppStateProvider';
import { MeetingMode, VideoFiltersCpuUtilization } from '../../types';
import { MeetingManagerJoinOptions } from 'amazon-chime-sdk-component-library-react/lib/providers/MeetingProvider/types';
import meetingConfig from '../../meetingConfig';




const VIDEO_TRANSFORM_FILTER_OPTIONS = [
  { value: VideoFiltersCpuUtilization.Disabled, label: 'Disable Video Filter' },
  { value: VideoFiltersCpuUtilization.CPU10Percent, label: 'Video Filter CPU 10%' },
  { value: VideoFiltersCpuUtilization.CPU20Percent, label: 'Video Filter CPU 20%' },
  { value: VideoFiltersCpuUtilization.CPU40Percent, label: 'Video Filter CPU 40%' },
];

const MEETING_OPTIONS = [
  { value: '', label: 'Select a chat room' },
  { value: 'hglrfbwvqo2ovtvm0d7vlx', label: 'Surgery Support' },
  { value: 'govwsvdclehi5m8cykufub', label: 'Recovery Lounge' },
  { value: 'dwiydas6howbzegcnfgere', label: 'All-Purpose Chat Room' },
];

const ROLE_OPTIONS = [
  { value: '', label: 'Select your role'},
  { value: 'Patient', label: 'Patient'},
  { value: 'PatientCompanion', label: 'Patient Companion'},
  { value: 'Nurse/Doctor', label: 'Nurse/Doctor'},
  { value: 'Prefer Not To Say', label: 'Prefer Not To Say'},
];

const MeetingForm: React.FC = () => {
  const meetingManager = useMeetingManager();
  const {
    region,
    meetingId,
    role,
    localUserName,
    meetingMode,
    enableSimulcast,
    priorityBasedPolicy,
    keepLastFrameWhenPaused,
    isWebAudioEnabled,
    videoTransformCpuUtilization: videoTransformCpuUtilization,
    setJoinInfo,
    isEchoReductionEnabled,
    toggleEchoReduction,
    toggleWebAudio,
    toggleSimulcast,
    togglePriorityBasedPolicy,
    toggleKeepLastFrameWhenPaused,
    setMeetingMode,
    setMeetingId,
    setRole,
    setLocalUserName,
    setRegion,
    setCpuUtilization,
  } = useAppState();
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');
  const [year, setYear] = useState('');
  const [monthErr, setMonthErr] = useState(false);
  const [dayErr, setDayErr] = useState(false);
  const [yearErr, setYearErr] = useState(false);

  const [nameErr, setNameErr] = useState(false);
  const [meetingIdErr, setMeetingIdErr] = useState(false);
  const [roleErr, setRoleErr] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isExisting, setIsExisting] = useState('waiting'); // waiting, no, yes
  const { errorMessage, updateErrorMessage } = useContext(getErrorContext());
  const history = useHistory();
  const browserBehavior = new DefaultBrowserBehavior();

  const handleChecking = async (e: React.FormEvent) => {
    e.preventDefault();
    const attendeeName = localUserName.trim();


    if (!attendeeName || !role || !month || !day || !year) {
      if (!attendeeName) {
        setNameErr(true);
      }
      if (!role) {
        setRoleErr(true);
      }
      if (!month) {
        setMonthErr(true);
      }
      if (!day) {
        setDayErr(true);
      }
      if (!year) {
        setYearErr(true);
      }

      return;
    }

    if (Number(month) <= 0 || Number(month) > 12) {
      setMonthErr(true);
      return;
    }

    if (Number(day) <= 0 || Number(day) > 31) {
      setDayErr(true);
      return;
    }

    if (Number(year) <= 1000 || Number(year) > 2023) {
      setYearErr(true);
      return;
    }

    setIsChecking(true);
    const bodyData = {
      'name': attendeeName,
      'role': role,
      'dob': year + '-' + month + '-' + day,
    };

    const res = await fetch('https://platform.happyhealinghouse.online/check', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: JSON.stringify(bodyData),
    });
  
    const status = res.status;
    if (status === 200) {
      setIsExisting('yes');
    } else {
      setIsExisting('no');
    }
    setIsChecking(false);
  };

  const handleJoinMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = meetingId.trim().toLocaleLowerCase();
    let attendeeName = localUserName.trim();

    if (!id || !attendeeName || !role) {
      if (!attendeeName) {
        setNameErr(true);
      }
      if (!id) {
        setMeetingIdErr(true);
      }
      if (!role) {
        setRoleErr(true);
      }

      return;
    }

    attendeeName += role === 'Prefer Not To Say' ? '' : '(' + role + ')';

    setIsLoading(true);
    meetingManager.getAttendee = createGetAttendeeCallback(id);

    try {
      const { JoinInfo } = await fetchMeeting(id, attendeeName, region, isEchoReductionEnabled);
      setJoinInfo(JoinInfo);
      const meetingSessionConfiguration = new MeetingSessionConfiguration(JoinInfo?.Meeting, JoinInfo?.Attendee);
      if (
        meetingConfig.postLogger &&
        meetingSessionConfiguration.meetingId &&
        meetingSessionConfiguration.credentials &&
        meetingSessionConfiguration.credentials.attendeeId
      ) {
        const existingMetadata = meetingConfig.postLogger.metadata;
        meetingConfig.postLogger.metadata = {
          ...existingMetadata,
          meetingId: meetingSessionConfiguration.meetingId,
          attendeeId: meetingSessionConfiguration.credentials.attendeeId,
        };
      }

      setRegion(JoinInfo.Meeting.MediaRegion);
      meetingSessionConfiguration.enableSimulcastForUnifiedPlanChromiumBasedBrowsers = enableSimulcast;
      if (priorityBasedPolicy) {
        meetingSessionConfiguration.videoDownlinkBandwidthPolicy = priorityBasedPolicy;
      }
      meetingSessionConfiguration.keepLastFrameWhenPaused = keepLastFrameWhenPaused;
      const options: MeetingManagerJoinOptions = {
        deviceLabels: meetingMode === MeetingMode.Spectator ? DeviceLabels.None : DeviceLabels.AudioAndVideo,
        enableWebAudio: isWebAudioEnabled,
      };

      await meetingManager.join(meetingSessionConfiguration, options);
      if (meetingMode === MeetingMode.Spectator) {
        await meetingManager.start();
        history.push(`${routes.MEETING}/${meetingId}`);
      } else {
        setMeetingMode(MeetingMode.Attendee);
        history.push(routes.DEVICE);
      }
    } catch (error) {
      updateErrorMessage((error as Error).message);
    }
  };

  const closeError = (): void => {
    updateErrorMessage('');
    setMeetingId('');
    setRole('');
    setLocalUserName('');
    setIsLoading(false);
    setIsExisting('waiting');
  };



  return (
    <form>
      <Heading tag="h1" level={4} css="margin-bottom: 1rem">
        Happy Healing House
      </Heading>
      <Flex container style={{ marginBottom: '1rem' }}>
        Please enter your information to join the chat!
      </Flex>

      { isExisting !== 'yes' ? 
        <div>


          <FormField
            field={Select}
            label="Role"
            options={ROLE_OPTIONS}
            value={role}
            error={roleErr}
            errorText='Please select a valid role'
            onChange={(e: ChangeEvent<HTMLSelectElement>): void => {
              setRole(e.target.value);
              if (roleErr) {
                setRoleErr(false);
              }
            }}
          />
          <FormField
            field={Input}
            label="Name"
            value={localUserName}
            fieldProps={{
              name: 'name',
              placeholder: 'Enter Your Name',
            }}
            errorText="Please enter a valid name"
            error={nameErr}
            onChange={(e: ChangeEvent<HTMLInputElement>): void => {
              setLocalUserName(e.target.value);
              if (nameErr) {
                setNameErr(false);
              }
            }}
          />

          <Label>Date of Birth</Label>
          <Flex container layout="equal-columns">
            <FormField
              field={Input}
              label="Month"
              value={month}
              fieldProps={{
                name: 'month',
                placeholder: 'MM',
              }}
              errorText="Please enter a valid Month"
              error={monthErr}
              onChange={(e: ChangeEvent<HTMLInputElement>): void => {
                setMonth(e.target.value);
                if (monthErr) {
                  setMonthErr(false);
                }
              }}
            />
            <FormField
              field={Input}
              label="Day"
              value={day}
              fieldProps={{
                name: 'day',
                placeholder: 'DD',
              }}
              errorText="Please enter a valid Day"
              error={dayErr}
              onChange={(e: ChangeEvent<HTMLInputElement>): void => {
                setDay(e.target.value);
                if (dayErr) {
                  setDayErr(false);
                }
              }}
            />
            <FormField
              field={Input}
              label="Year"
              value={year}
              fieldProps={{
                name: 'year',
                placeholder: 'YYYY',
              }}
              errorText="Please enter a valid Year"
              error={yearErr}
              onChange={(e: ChangeEvent<HTMLInputElement>): void => {
                setYear(e.target.value);
                if (yearErr) {
                  setYearErr(false);
                }
              }}
            />
          </Flex>


          <Flex container layout="fill-space-centered" style={{ marginTop: '1rem' }}>
            {isChecking ? <Spinner /> : <PrimaryButton label="Continue" onClick={handleChecking} />}
          </Flex>

        </div> : 

        <Flex>
          <Flex>Your Information</Flex>
          <Flex>Role: {role}</Flex>
          <Flex>Name: {localUserName}</Flex>
          <Flex>Date of Birth: {month}, {day}, {year}</Flex>
        </Flex>
      }


      <Flex container layout="fill-space-centered" style={{ marginTop: '1rem' }}>
        {isExisting === 'waiting' ? '' : 
          isExisting === 'yes' ? '': 'User does not exist, please try again'}
      </Flex>


      {isExisting === 'yes'? <div>
        <FormField
          field={Input}
          label="Nickname (This will be shown in the chat room)"
          value={localUserName}
          fieldProps={{
            name: 'nickname',
            placeholder: 'Enter Your Name or NickName',
          }}
          errorText="Please enter a valid nickname"
          error={nameErr}
          onChange={(e: ChangeEvent<HTMLInputElement>): void => {
            setLocalUserName(e.target.value);
            if (nameErr) {
              setNameErr(false);
            }
          }}
        />
        <FormField
          field={Select}
          label="Chat Room Type"
          options={MEETING_OPTIONS}
          value={meetingId}
          error={meetingIdErr}
          errorText='Please select a valid chat room'
          onChange={(e: ChangeEvent<HTMLSelectElement>): void => {
            setMeetingId(e.target.value);
            if (meetingIdErr) {
              setMeetingIdErr(false);
            }
          }}
        />
        <RegionSelection setRegion={setRegion} region={region} />
        <FormField
          field={Checkbox}
          label="Join w/o Audio and Video"
          value=""
          checked={meetingMode === MeetingMode.Spectator}
          onChange={(): void => {
            if (meetingMode === MeetingMode.Spectator) {
              setMeetingMode(MeetingMode.Attendee);
            } else {
              setMeetingMode(MeetingMode.Spectator);
            }
          }}
        />
        <FormField
          field={Checkbox}
          label="Enable Web Audio"
          value=""
          checked={isWebAudioEnabled}
          onChange={toggleWebAudio}
          infoText="Enable Web Audio to use Voice Focus"
        />
        {/* Amazon Chime Echo Reduction is a premium feature, please refer to the Pricing page for details.*/}
        {isWebAudioEnabled && (
          <FormField
            field={Checkbox}
            label="Enable Echo Reduction"
            value=""
            checked={isEchoReductionEnabled}
            onChange={toggleEchoReduction}
            infoText="Enable Echo Reduction (new meetings only)"
          />
        )}
        {/* BlurSelection */}
        {/* Background Video Transform Selections */}
        <FormField
          field={Select}
          options={VIDEO_TRANSFORM_FILTER_OPTIONS}
          onChange={(e: ChangeEvent<HTMLSelectElement>): void => {
            setCpuUtilization(e.target.value);
          }}
          value={videoTransformCpuUtilization}
          label="Background Filters CPU Utilization"
        />
        {/* Video uplink and downlink policies */}
        {browserBehavior.isSimulcastSupported() && (
          <FormField
            field={Checkbox}
            label="Enable Simulcast"
            value=""
            checked={enableSimulcast}
            onChange={toggleSimulcast}
          />
        )}

        {browserBehavior.supportDownlinkBandwidthEstimation() && (
          <FormField
            field={Checkbox}
            label="Use Priority-Based Downlink Policy"
            value=""
            checked={priorityBasedPolicy !== undefined}
            onChange={togglePriorityBasedPolicy}
          />
        )}
        <FormField
          field={Checkbox}
          label="Keep Last Frame When Paused"
          value=""
          checked={keepLastFrameWhenPaused}
          onChange={toggleKeepLastFrameWhenPaused}
        />
        <Flex container layout="fill-space-centered" style={{ marginTop: '2.5rem' }}>
          {isLoading ? <Spinner /> : <PrimaryButton label="Continue" onClick={handleJoinMeeting} />}
        </Flex>
        {errorMessage && (
          <Modal size="md" onClose={closeError}>
            <ModalHeader title={`Meeting ID: ${meetingId}`} />
            <ModalBody>
              <Card
                title="Unable to join meeting"
                description="There was an issue finding that meeting. The meeting may have already ended, or your authorization may have expired."
                smallText={errorMessage}
              />
            </ModalBody>
          </Modal>
        )}
        <DevicePermissionPrompt />
      </div> : null
      }
    </form>
  );
};

export default MeetingForm;
