import * as React from 'react'
import { Provider, useMutation, useQuery, OperationResult } from 'urql'
import client from '../client'
// @ts-expect-error
import { history } from 'umi'
import * as utils from '../utils'
import { useFormik } from 'formik'
import * as yup from 'yup'
import { View, Flex, Button, Text, IllustratedMessage, Link, Heading, Content, DialogTrigger, Footer, ActionButton, Dialog, Divider, ButtonGroup, Form, TextField, RadioGroup, Radio, Header, MenuTrigger, Menu, Item, Picker, Section } from '@adobe/react-spectrum'
import Table, { TableHead, TableBody, TableHeadCell, TableRow, TableCell } from '../components/Table'
import { userService } from '../service'
import { SignInResult, SignIn, SignUpResult, SignUp, GetUserTeams, GetUserTeamsResult, GetTeamDocsResult, GetTeamDocs, CreateDocResult, CreateDoc, CreateTeam, CreateTeamParams, CreateTeamResult } from '../gql'
import AppFooter from '../components/Footer'

function CreateDocTrigger({
  teams
}: {
  teams: GetUserTeamsResult['users'][0]['user_teams']
}) {
  const [createDocResult, createDoc] = useMutation<CreateDocResult>(CreateDoc)

  const form = useFormik({
    initialValues: {
      title: '',
      teamId: teams[0]?.team.id || ''
    },
    async onSubmit(values) {
      const result = await createDoc({
        title: values.title,
        teamId: values.teamId
      })

      if (result.data?.insert_doc_one.id) {
        history.push(`/doc/${result.data.insert_doc_one.id}`)
      } else {
        // TODO: create page error
      }
    }
  })

  React.useEffect(() => {
    if (teams.length > 0 && !form.values.teamId) {
      form.setFieldValue('teamId', teams[0].team.id)
    }
  }, [teams])

  return (
    <DialogTrigger>
      <Button variant='primary' >Create doc</Button >

      {close => {
        return (
          <Dialog>
            <Heading>Create a doc</Heading>
            <Divider />
            <Content>


              <View>
                <Form isQuiet>
                  <Flex gap='size-100'>
                    <View flex={1}>
                      <Picker onSelectionChange={utils.setFieldValue(form, 'teamId')} selectedKey={form.values.teamId} label='Team' placeholder='Team' isQuiet={false} width='size-1700'>
                        {teams.map(team => {
                          return (
                            <Item key={team.team.id}>{team.team.title}</Item>
                          )
                        })}
                      </Picker>
                    </View>
                    <View flex={7}>
                      <TextField width='100%' value={form.values.title} onChange={utils.setFieldValue(form, 'title')} label='Doc Title' isRequired />
                    </View>
                  </Flex>

                  <RadioGroup label='Template' orientation='horizontal' value='docute'>
                    <Radio value='docute'>Docute</Radio>
                    <Radio isDisabled value='docsify'>Docsify (comming soon...)</Radio>
                  </RadioGroup>

                </Form>
              </View>
            </Content>

            <ButtonGroup>
              <Button variant='secondary' onPress={close}>Cancel</Button>
              <Button variant='cta' onPress={form.submitForm}>Create</Button>
            </ButtonGroup>
          </Dialog>
        )
      }}
    </DialogTrigger>
  )
}

function Docs({
  docs,
  onClickDoc
}: {
  docs: GetTeamDocsResult['doc'],
  onClickDoc?: (doc: GetTeamDocsResult['doc'][0]) => void
}) {

  return (
    <Table>
      <TableHead>
        <TableHeadCell>
          <Text>Doc</Text>
        </TableHeadCell>

        <TableHeadCell>
          <Text>Created Date</Text>
        </TableHeadCell>

      </TableHead>

      <TableBody>
        {docs.map(doc => {

          return (
            <TableRow key={doc.id} onClick={onClickDoc ? _ => onClickDoc(doc) : utils.noop}>
              <TableCell>{doc.title}</TableCell>
              <TableCell>{(new Date(doc.created_at).toLocaleString())}</TableCell>
            </TableRow>
          )
        })}
      </TableBody>

    </Table>
  )
}

function CreateTeamTrigger({
  isOpen,
  onClickCancel,
  onCreateSuccess
}: {
  isOpen: boolean,
  onClickCancel: () => void,
  onCreateSuccess: (result: OperationResult<CreateTeamResult>) => void
}) {

  const [createTeamResult, createTeam] = useMutation<CreateTeamResult, CreateTeamParams>(CreateTeam)

  const form = useFormik({
    initialValues: {
      title: ''
    },
    async onSubmit(values) {
      const result = await createTeam({
        title: values.title
      })
      if (!result.error) {
        onCreateSuccess(result)
      }
    }
  })

  return <DialogTrigger isOpen={isOpen}>
    <div />
    <Dialog size='S'>
      <Heading>Create Team</Heading>
      <Divider />
      <Content>
        <Form isQuiet>
          <TextField onChange={utils.setFieldValue(form, 'title')} label='Title' />
        </Form>
      </Content>

      <ButtonGroup>
        <Button onPress={onClickCancel} variant='secondary'>Cancel</Button>
        <Button onPress={form.submitForm} variant='cta'>Create</Button>
      </ButtonGroup>
    </Dialog>
  </DialogTrigger>
}

function Layout(props) {

  const [isSignUpDialog, setIsSignupDialog] = React.useState(true)

  const [getUserTeamsResult, getUserTeams] = useQuery<GetUserTeamsResult>({ query: GetUserTeams, pause: !userService.isLogin() })

  const [createTeamDialogOpened, setCreateTeamDialogOpened] = React.useState(false)

  const teams = getUserTeamsResult.data ? getUserTeamsResult.data.users[0].user_teams : []

  return (
    <div>
      <CreateTeamTrigger
        onCreateSuccess={result => {
          const team = result.data!.createTeam
          setCreateTeamDialogOpened(false)
          setTimeout(() => {
            history.push(`/app/team/${team.teamId}`)

          }, 0)
        }}
        isOpen={createTeamDialogOpened}
        onClickCancel={() => setCreateTeamDialogOpened(false)}
      />
      <View paddingY='size-150'>
        <Flex direction='row' justifyContent='center'>
          <Flex direction='row' width='960px' justifyContent='space-between'>
            <Flex justifyContent='center'>
              <Heading alignSelf='center' level={3}>
                <a style={{ cursor: 'pointer' }} onClick={_ => history.push('/app')}>Docmate</a>
              </Heading>
              <small>Alpha</small>
            </Flex>

            <Flex justifyContent='center'>
              {userService.isLogin() && (
                <Flex alignSelf='center' gap='size-100'>
                  <View alignSelf='center'>
                    <CreateDocTrigger teams={teams} />
                  </View>

                  <Flex alignSelf='center'>
                    <MenuTrigger>
                      <ActionButton isQuiet UNSAFE_style={{ cursor: 'pointer' }}>
                        <img width='28px' style={{ borderRadius: '50%' }} src={`https://www.gravatar.com/avatar/${userService.getUserInfo().avatar}`} />
                      </ActionButton>
                      <Menu onAction={key => {
                        if (key === 'signout') {
                          userService.signOut()
                        } else if (key === 'create_team') {
                          setCreateTeamDialogOpened(true)
                        }
                      }}>
                        <Section>
                          <Item key='create_team'>
                            Create Team
                            </Item>
                        </Section>
                        <Section>
                          <Item key='signout'>Sign Out</Item>
                        </Section>
                      </Menu>
                    </MenuTrigger>
                  </Flex>

                </Flex>
              )}
            </Flex>

          </Flex>

        </Flex>

        <View>
          {userService.isLogin() ? <DocsPannel {...props} teams={teams} /> : <Sign />}
        </View>
      </View>

      <AppFooter />
    </div>
  )
}

function DocsPannel({
  teams,
  children,
  history,
  ...props
}: {
  teams: GetUserTeamsResult['users'][0]['user_teams'],
  children: any,
  history: any,
  match: {
    params: {
      teamId?: string
    }
  }
}) {
  const [selectedTeam, setSelectedTeam] = React.useState(props.match.params.teamId as null | string)
  const [getTeamDocsResult, getTeamDocs] = useQuery<GetTeamDocsResult>({ query: GetTeamDocs, variables: { teamId: selectedTeam } })

  React.useEffect(() => {
    if (!selectedTeam && teams.length > 0) {
      setSelectedTeam(teams[0]?.team.id)
    }
  }, [teams])

  return (
    <Flex justifyContent='center'>
      <View width='960px' marginY='size-500' minHeight='600px'>
        {children}
      </View>
    </Flex>
  )
}


enum SignView {
  SignUp,
  SignIn
}
function Sign() {

  const [view, setView] = React.useState(SignView.SignIn)

  return (
    <View marginY='size-500'>
      <Flex justifyContent='center'>
        <View width='320px' backgroundColor='static-white' padding='size-500' UNSAFE_style={{ boxSizing: 'border-box' }} UNSAFE_className='rounded'>
          {view === SignView.SignUp ? <SignUpForm setView={setView} /> : <SignInForm />}

          <Flex justifyContent='center'>
            <View marginTop='size-200'>
              {view === SignView.SignUp ? <Link onPress={_ => setView(SignView.SignIn)}>Already have account</Link> : <Link onPress={_ => setView(SignView.SignUp)}>Create account</Link>}
            </View>
          </Flex>
        </View>
      </Flex>
    </View>
  )
}

function SignUpForm(props: {
  setView: any
}) {
  const [signupResult, signUp] = useMutation<SignUpResult>(SignUp)
  const [errorMessage, setErrorMessage] = React.useState(null as null | string)


  const form = useFormik({
    initialValues: {
      password: '',
      password_confirm: '',
      email: ''
    },
    validationSchema() {
      return yup.object().shape({
        password: yup.string().required(),
        password_confirm: yup.string().required(),
        email: yup.string().required()
      })
    },
    async onSubmit(values) {
      const result = await signUp({
        email: values.email,
        password: values.password.toString(),
        password_confirm: values.password_confirm.toString()
      })

      if (!result.error) {
        utils.alert('Account created! Please sign in now', { type: 'success' })
        props.setView(SignView.SignIn)
      } else {
        setErrorMessage(result.error.graphQLErrors[0].message)
      }
    }
  })

  async function onClickSignUp() {
    await form.submitForm()
  }

  return (
    <>
      <Heading marginTop='0' level={1}>Welcome to Docmate</Heading>
      <Heading marginTop='0' level={4}>Create a free account</Heading>

      <Form isQuiet isRequired>
        <Text UNSAFE_style={{ color: 'red' }}>{errorMessage}</Text>

        <TextField validationState={form.errors.email ? 'invalid' : 'valid'} value={form.values.email} onChange={utils.setFieldValue(form, 'email')} label='email' placeholder='john@example.com' />
        <TextField validationState={form.errors.password ? 'invalid' : 'valid'} type='password' value={form.values.password} onChange={utils.setFieldValue(form, 'password')} label='password' />
        <TextField validationState={form.errors.password_confirm ? 'invalid' : 'valid'} type='password' value={form.values.password_confirm} onChange={utils.setFieldValue(form, 'password_confirm')} label='password confirm' />

        <Button isDisabled={signupResult.fetching} onPress={onClickSignUp} marginTop='size-500' variant='cta'> Create Account</Button>
      </Form>
    </>
  )
}

function SignInForm() {
  const [signInResult, signIn] = useMutation<SignInResult>(SignIn)

  const [errorMessage, setErrorMessage] = React.useState(null as null | string)

  const form = useFormik({
    initialValues: {
      email: '',
      password: ''
    },
    async onSubmit(values) {
      const result = await signIn({
        email: values.email,
        password: values.password
      })
      if (!result.error) {
        const signInData = result.data!.signIn
        userService.saveToken(signInData.token)
        userService.saveUserInfo({
          email: signInData.email,
          id: signInData.id,
          avatar: signInData.avatar,
          username: signInData.username
        })
        location.reload()
      } else {
        setErrorMessage(result.error!.graphQLErrors[0].message)
      }
    }
  })

  function onClickSignIn() {
    form.submitForm()
  }

  return (
    <>
      <Heading marginTop='size-0' level={1}>Welcome to Docmate</Heading>
      <Form isQuiet>
        <Text UNSAFE_style={{ color: 'red' }}>{errorMessage}</Text>
        <TextField value={form.values.email} onChange={utils.setFieldValue(form, 'email')} label='email' placeholder='john@example.com' />
        <TextField type='password' value={form.values.password} onChange={utils.setFieldValue(form, 'password')} label='password' />

        <Button isDisabled={signInResult.fetching} onPress={onClickSignIn} marginTop='size-500' variant='cta'>Sign In</Button>
      </Form>
    </>
  )
}

export default Layout